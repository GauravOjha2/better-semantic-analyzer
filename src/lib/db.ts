/**
 * PostgreSQL Database Layer
 *
 * Handles connection pooling, analysis caching (24h dedup), and historical storage.
 * Designed for Neon/Railway/Render PostgreSQL -- NOT Supabase.
 */

import { Pool, type PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { CompatibilityReport, AnalysisResponse } from "@/types";

// Connection pool -- reused across requests in the same serverless instance
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: connectionString.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

/**
 * Initialize the database schema.
 * Safe to call multiple times (uses IF NOT EXISTS).
 */
export async function initializeDatabase(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_a TEXT NOT NULL,
        user_b TEXT NOT NULL,
        posts_fetched_a INT NOT NULL DEFAULT 0,
        posts_fetched_b INT NOT NULL DEFAULT 0,
        pairs_analyzed INT NOT NULL DEFAULT 0,
        provider TEXT NOT NULL DEFAULT 'groq',
        report_json JSONB NOT NULL,
        latency_ms INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_analyses_users 
        ON analyses (user_a, user_b);
      
      CREATE INDEX IF NOT EXISTS idx_analyses_created 
        ON analyses (created_at DESC);
    `);
  } finally {
    client.release();
  }
}

/**
 * Normalize user pair ordering so (A, B) and (B, A) hit the same cache.
 */
function normalizeUsers(userA: string, userB: string): [string, string] {
  const a = userA.toLowerCase().trim();
  const b = userB.toLowerCase().trim();
  return a <= b ? [a, b] : [b, a];
}

/**
 * Check for a cached analysis from the last 24 hours.
 * Returns null if no valid cache exists.
 */
export async function getCachedAnalysis(
  userA: string,
  userB: string
): Promise<AnalysisResponse | null> {
  let client: PoolClient | undefined;
  try {
    const db = getPool();
    client = await db.connect();
    const [normalA, normalB] = normalizeUsers(userA, userB);

    const result = await client.query(
      `SELECT id, user_a, user_b, posts_fetched_a, posts_fetched_b, 
              pairs_analyzed, provider, report_json, latency_ms, created_at
       FROM analyses
       WHERE user_a = $1 AND user_b = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalA, normalB]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userA: row.user_a,
      userB: row.user_b,
      postsFetchedA: row.posts_fetched_a,
      postsFetchedB: row.posts_fetched_b,
      pairsAnalyzed: row.pairs_analyzed,
      provider: row.provider,
      report: row.report_json as CompatibilityReport,
      latencyMs: row.latency_ms,
      createdAt: row.created_at,
      cached: true,
    };
  } catch (error) {
    // If DB is unavailable, continue without cache
    console.warn("[db] Cache lookup failed:", error);
    return null;
  } finally {
    client?.release();
  }
}

/**
 * Store a completed analysis in the database.
 */
export async function storeAnalysis(params: {
  userA: string;
  userB: string;
  postsFetchedA: number;
  postsFetchedB: number;
  pairsAnalyzed: number;
  provider: string;
  report: CompatibilityReport;
  latencyMs: number;
}): Promise<string> {
  let client: PoolClient | undefined;
  const id = uuidv4();

  try {
    const db = getPool();
    client = await db.connect();
    const [normalA, normalB] = normalizeUsers(params.userA, params.userB);

    await client.query(
      `INSERT INTO analyses (id, user_a, user_b, posts_fetched_a, posts_fetched_b, 
                             pairs_analyzed, provider, report_json, latency_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        normalA,
        normalB,
        params.postsFetchedA,
        params.postsFetchedB,
        params.pairsAnalyzed,
        params.provider,
        JSON.stringify(params.report),
        params.latencyMs,
      ]
    );

    return id;
  } catch (error) {
    // If DB is unavailable, log but don't fail the request
    console.warn("[db] Store failed:", error);
    return id;
  } finally {
    client?.release();
  }
}
