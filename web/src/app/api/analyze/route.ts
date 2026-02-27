/**
 * POST /api/analyze
 *
 * Main analysis endpoint. Orchestrates:
 * 1. Request validation
 * 2. Rate limiting
 * 3. Cache check (24h dedup)
 * 4. Reddit data fetching
 * 5. Smart sampling + LLM analysis
 * 6. Database storage
 * 7. Structured JSON response
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchUserPosts } from "@/lib/reddit";
import { generateAnalysis } from "@/lib/analyzer";
import { getCachedAnalysis, storeAnalysis, initializeDatabase } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { AnalysisResponse, ApiError } from "@/types";

// Request validation schema
const AnalyzeSchema = z.object({
  userA: z
    .string()
    .min(1, "Username A is required")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Reddit username"),
  userB: z
    .string()
    .min(1, "Username B is required")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Reddit username"),
  postsLimit: z.number().int().min(20).max(200).optional().default(50),
  samplePairs: z.number().int().min(10).max(30).optional().default(15),
});

// Database initialization flag
let dbInitialized = false;

function errorResponse(
  error: string,
  code: string,
  status: number,
  details?: string
): NextResponse<ApiError> {
  return NextResponse.json({ error, code, details }, { status });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Rate limiting
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    logger.warn("Rate limit exceeded", { ip });
    return errorResponse(
      "Rate limit exceeded. Please try again later.",
      "RATE_LIMITED",
      429
    );
  }

  // Parse and validate request body
  let body: z.infer<typeof AnalyzeSchema>;
  try {
    const raw = await request.json();
    body = AnalyzeSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(
        "Invalid request parameters",
        "VALIDATION_ERROR",
        400,
        err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
      );
    }
    return errorResponse("Invalid JSON body", "PARSE_ERROR", 400);
  }

  // Same-user check
  if (body.userA.toLowerCase() === body.userB.toLowerCase()) {
    return errorResponse(
      "Cannot compare a user with themselves",
      "SAME_USER",
      400
    );
  }

  logger.info("Analysis started", {
    userA: body.userA,
    userB: body.userB,
    postsLimit: body.postsLimit,
    samplePairs: body.samplePairs,
    ip,
  });

  // Initialize database on first request
  if (!dbInitialized && process.env.DATABASE_URL) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (err) {
      logger.warn("Database initialization failed, continuing without cache", {
        error: String(err),
      });
    }
  }

  // Check cache (24h dedup)
  if (process.env.DATABASE_URL) {
    try {
      const cached = await getCachedAnalysis(body.userA, body.userB);
      if (cached) {
        logger.info("Cache hit", {
          userA: body.userA,
          userB: body.userB,
          cachedId: cached.id,
        });
        return NextResponse.json(cached, {
          headers: {
            "X-Cache": "HIT",
            "X-RateLimit-Remaining": String(rateCheck.remaining),
          },
        });
      }
    } catch (err) {
      logger.warn("Cache check failed", { error: String(err) });
    }
  }

  try {
    // Fetch Reddit posts for both users
    logger.info("Fetching Reddit posts", { userA: body.userA });
    const postsA = await fetchUserPosts(body.userA, body.postsLimit);

    logger.info("Fetching Reddit posts", { userB: body.userB });
    const postsB = await fetchUserPosts(body.userB, body.postsLimit);

    if (postsA.length === 0) {
      return errorResponse(
        `No public posts found for u/${body.userA}`,
        "NO_POSTS",
        404
      );
    }
    if (postsB.length === 0) {
      return errorResponse(
        `No public posts found for u/${body.userB}`,
        "NO_POSTS",
        404
      );
    }

    // Generate analysis
    logger.info("Generating analysis", {
      postsA: postsA.length,
      postsB: postsB.length,
      samplePairs: body.samplePairs,
    });

    const { report, pairsAnalyzed } = await generateAnalysis(
      postsA,
      postsB,
      body.userA,
      body.userB,
      body.samplePairs
    );

    const latencyMs = Date.now() - startTime;

    // Store in database
    let analysisId = crypto.randomUUID();
    if (process.env.DATABASE_URL) {
      try {
        analysisId = await storeAnalysis({
          userA: body.userA,
          userB: body.userB,
          postsFetchedA: postsA.length,
          postsFetchedB: postsB.length,
          pairsAnalyzed,
          provider: "groq",
          report,
          latencyMs,
        });
      } catch (err) {
        logger.warn("Failed to store analysis", { error: String(err) });
      }
    }

    const response: AnalysisResponse = {
      id: analysisId,
      userA: body.userA,
      userB: body.userB,
      postsFetchedA: postsA.length,
      postsFetchedB: postsB.length,
      pairsAnalyzed,
      provider: "groq",
      report,
      latencyMs,
      createdAt: new Date().toISOString(),
      cached: false,
    };

    logger.info("Analysis complete", {
      id: analysisId,
      userA: body.userA,
      userB: body.userB,
      latencyMs,
      postsA: postsA.length,
      postsB: postsB.length,
      pairsAnalyzed,
    });

    return NextResponse.json(response, {
      headers: {
        "X-Cache": "MISS",
        "X-Latency-Ms": String(latencyMs),
        "X-RateLimit-Remaining": String(rateCheck.remaining),
      },
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("Analysis failed", {
      userA: body.userA,
      userB: body.userB,
      error: message,
      latencyMs,
    });

    // Normalize error responses
    if (message.includes("not found")) {
      return errorResponse(message, "USER_NOT_FOUND", 404);
    }
    if (message.includes("private") || message.includes("suspended")) {
      return errorResponse(message, "USER_INACCESSIBLE", 403);
    }
    if (message.includes("GROQ_API_KEY")) {
      return errorResponse(
        "Analysis service is not configured",
        "CONFIG_ERROR",
        503
      );
    }
    if (message.includes("Reddit auth failed")) {
      return errorResponse(
        "Reddit API connection failed",
        "REDDIT_AUTH_ERROR",
        503
      );
    }

    return errorResponse(
      "Analysis failed. Please try again.",
      "INTERNAL_ERROR",
      500,
      process.env.NODE_ENV === "development" ? message : undefined
    );
  }
}
