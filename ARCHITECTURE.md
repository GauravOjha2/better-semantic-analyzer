# Architecture

## Overview

The Semantic Compatibility Engine is a **Next.js 14** full-stack web application that compares two Reddit users' posting histories and generates a structured compatibility report using a Large Language Model. The system follows a **layered architecture** with clear separation between presentation, API orchestration, backend services, and data persistence.

**Core principle:** LLM-first analysis. No embeddings, no cosine similarity, no vector databases. A well-prompted LLM analyzing raw post text produces comparable or better compatibility analysis than a multi-stage embedding pipeline -- with far less infrastructure complexity.

---

## System Layers

```
+-----------------------------------------------------------+
|                   PRESENTATION LAYER                      |
|              Next.js App Router (React 18)                |
|  - Landing page with glassmorphism UI                     |
|  - Results page with radar chart, score circle, cards     |
|  - Loading overlay with 4-step progress                   |
|  - Tailwind CSS + Synapse design system                   |
+-----------------------------------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|                   API LAYER                               |
|           POST /api/analyze (route.ts)                    |
|  - Zod request validation                                 |
|  - In-memory sliding window rate limiting                 |
|  - 24h cache dedup with normalized user ordering          |
|  - Error normalization with specific error codes          |
|  - Structured JSON logging + latency measurement          |
+-----------------------------------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|                  SERVICE LAYER                            |
|                                                           |
|  reddit.ts      - OAuth2 client credentials flow          |
|                 - Direct REST API (no PRAW, no snoowrap)  |
|                 - In-memory token caching                 |
|                                                           |
|  analyzer.ts    - Smart sampling (50% random + 50% long)  |
|                 - Prompt construction (social psychologist)|
|                 - Groq LLM call (Llama 3.3 70B)           |
|                 - JSON response parsing with fallback     |
|                                                           |
|  db.ts          - PostgreSQL connection pooling (pg)      |
|                 - Analysis caching (24h TTL)               |
|                 - Normalized user pair storage             |
+-----------------------------------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|                   DATA LAYER                              |
|  - Reddit OAuth2 REST API (submissions + comments)        |
|  - Groq Cloud API (Llama 3.3 70B Versatile)              |
|  - PostgreSQL (Neon/Railway/Render, NOT Supabase)         |
+-----------------------------------------------------------+
```

---

## Component Map

### API Route: `src/app/api/analyze/route.ts` (267 lines)

The single orchestration endpoint. Handles the full request lifecycle:

| Component             | Responsibility                                                   |
| --------------------- | ---------------------------------------------------------------- |
| `AnalyzeSchema`       | Zod schema: validates usernames, postsLimit (20-200), samplePairs (10-30) |
| `checkRateLimit(ip)`  | Sliding window rate limiter (10 req/min default)                |
| `getCachedAnalysis()` | 24h cache lookup with normalized user pair ordering             |
| `fetchUserPosts()`    | Reddit data collection for both users                           |
| `generateAnalysis()`  | Smart sampling + LLM analysis pipeline                          |
| `storeAnalysis()`     | Persist results to PostgreSQL                                   |
| `errorResponse()`     | Normalized error format with specific codes (RATE_LIMITED, VALIDATION_ERROR, NO_POSTS, USER_NOT_FOUND, etc.) |

### Service: `src/lib/reddit.ts` (141 lines)

Reddit API integration via direct OAuth2 REST calls:

| Component          | Responsibility                                                    |
| ------------------- | ----------------------------------------------------------------- |
| `getRedditToken()` | OAuth2 client credentials flow with in-memory token caching       |
| `fetchUserPosts()` | Fetches submissions (limit/2) + comments (limit/2), filters <10 chars, sorts by score |

### Service: `src/lib/analyzer.ts` (204 lines)

Core analysis pipeline -- direct port of `generate_analysis()` from `streamlit_app.py`:

| Component          | Responsibility                                                     |
| ------------------- | ------------------------------------------------------------------ |
| `samplePairs()`    | Hybrid sampling: 50% random + 50% longest pairs from cross-product |
| `buildPrompt()`    | Constructs social psychologist persona prompt with 300-char truncated pairs |
| `parseReport()`    | Parses LLM JSON response into CompatibilityReport; falls back to raw markdown |
| `generateAnalysis()` | Orchestrates: sample -> prompt -> Groq API call -> parse         |

### Service: `src/lib/db.ts` (171 lines)

PostgreSQL persistence layer:

| Component              | Responsibility                                              |
| ----------------------- | ----------------------------------------------------------- |
| `getPool()`            | Lazy connection pool initialization (max 5, 30s idle timeout) |
| `initializeDatabase()` | Creates schema if not exists (safe for repeated calls)       |
| `normalizeUsers()`     | Alphabetically sorts user pair so (A,B) and (B,A) share cache |
| `getCachedAnalysis()`  | Finds most recent analysis for pair within 24 hours          |
| `storeAnalysis()`      | Inserts completed analysis with JSONB report                 |

### Service: `src/lib/rate-limit.ts` (59 lines)

| Component           | Responsibility                                            |
| -------------------- | --------------------------------------------------------- |
| `checkRateLimit(ip)` | Sliding window counter per IP, 10 req/min default, probabilistic cleanup |

### Service: `src/lib/logger.ts` (53 lines)

| Component | Responsibility                                            |
| ---------- | --------------------------------------------------------- |
| `logger`  | JSON-structured logging (info/warn/error/debug) to stdout, captured by Vercel/Railway log aggregation |

---

## Frontend Components

### Pages

| File                         | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `src/app/layout.tsx`         | Root layout: Inter + JetBrains Mono fonts, Material Symbols, meta  |
| `src/app/page.tsx`           | Landing page: hero, username form, architecture pipeline, features |
| `src/app/results/page.tsx`   | Results page: score circle, radar chart, analysis cards, metadata  |
| `src/app/globals.css`        | Synapse design system: glass-panel, glass-card, cosmic-orb, bg-grid |

### Shared Components

| File                             | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `src/components/Navbar.tsx`      | Navigation bar with scroll-aware background  |
| `src/components/Footer.tsx`      | Footer with project links and branding        |
| `src/components/LoadingOverlay.tsx` | 4-step progress overlay during analysis      |

---

## Tech Stack

| Layer           | Technology                              | Notes                          |
| --------------- | --------------------------------------- | ------------------------------ |
| Framework       | Next.js 14.2 (App Router)              | TypeScript, React 18           |
| Styling         | Tailwind CSS 3.4                        | + custom Synapse design system |
| Validation      | Zod 3.24                                | Request schema validation      |
| LLM             | Groq SDK (Llama 3.3 70B Versatile)     | Structured JSON output         |
| Reddit API      | Direct OAuth2 REST                      | Client credentials flow        |
| Database        | PostgreSQL 14+ (pg driver)             | Neon / Railway / Render        |
| Deployment      | Vercel                                  | Serverless functions           |
| Dev Environment | Node.js 18+, TypeScript 5.7            |                                |

---

## Design Patterns

| Pattern                 | Location                    | Description                                                    |
| ----------------------- | --------------------------- | -------------------------------------------------------------- |
| **Layered Architecture** | Entire `web/src/` tree     | Presentation -> API -> Service -> Data, each layer independent |
| **Cache-Aside**         | `route.ts` + `db.ts`       | Check cache first, compute on miss, store result               |
| **Normalized Keys**     | `db.ts` `normalizeUsers()` | Alphabetical sorting ensures (A,B) == (B,A) for cache hits    |
| **Graceful Degradation** | `route.ts` DB checks      | App works without DATABASE_URL (no caching, no persistence)    |
| **Error Normalization** | `route.ts` error handler   | Maps internal errors to user-facing codes + HTTP status        |
| **Token Caching**       | `reddit.ts`                | In-memory OAuth2 token reuse until near-expiry                 |

---

## Directory Structure

```
better-semantic-analyzer/
|
+-- web/                             # Next.js 14 application
|   +-- src/
|   |   +-- app/
|   |   |   +-- api/analyze/route.ts   # POST /api/analyze endpoint
|   |   |   +-- layout.tsx             # Root layout
|   |   |   +-- page.tsx               # Landing page
|   |   |   +-- globals.css            # Synapse design system CSS
|   |   |   +-- results/page.tsx       # Results page
|   |   +-- components/
|   |   |   +-- Navbar.tsx
|   |   |   +-- Footer.tsx
|   |   |   +-- LoadingOverlay.tsx
|   |   +-- lib/
|   |   |   +-- analyzer.ts           # Smart sampling + LLM analysis
|   |   |   +-- reddit.ts             # Reddit OAuth2 + data fetching
|   |   |   +-- db.ts                 # PostgreSQL connection + caching
|   |   |   +-- rate-limit.ts         # In-memory rate limiter
|   |   |   +-- logger.ts             # Structured JSON logging
|   |   +-- types/
|   |       +-- index.ts              # All TypeScript interfaces
|   +-- public/                        # Static assets
|   +-- package.json
|   +-- tsconfig.json
|   +-- next.config.js
|   +-- tailwind.config.js
|   +-- postcss.config.js
|   +-- .env.example
|
+-- sql/
|   +-- schema.sql                    # PostgreSQL schema + reference queries
|
+-- streamlit_app.py                  # [Legacy] Original Streamlit app
+-- llm_providers.py                  # [Legacy] Multi-provider LLM abstraction
+-- reddit_scraper.py                 # [Legacy] PRAW-based Reddit scraper
+-- requirements.txt                  # [Legacy] Python dependencies
```

---

## Configuration

### Required Environment Variables

Set in `.env.local` (local) or Vercel dashboard (production):

| Variable               | Source                             | Required |
| ----------------------- | ---------------------------------- | -------- |
| `REDDIT_CLIENT_ID`     | https://www.reddit.com/prefs/apps  | Yes      |
| `REDDIT_CLIENT_SECRET` | https://www.reddit.com/prefs/apps  | Yes      |
| `GROQ_API_KEY`         | https://console.groq.com           | Yes      |
| `DATABASE_URL`         | Neon / Railway / Render dashboard  | No*      |

*The app runs without a database -- caching and history are disabled but analysis still works.

### Optional Configuration

| Variable                   | Default | Purpose                        |
| --------------------------- | ------- | ------------------------------ |
| `RATE_LIMIT_MAX_REQUESTS`  | `10`    | Max requests per window per IP |
| `RATE_LIMIT_WINDOW_MS`     | `60000` | Rate limit window (ms)         |

### Request Parameters (POST /api/analyze)

| Parameter     | Range   | Default | Purpose                           |
| -------------- | ------- | ------- | --------------------------------- |
| `userA`       | 1-20    | --      | First Reddit username             |
| `userB`       | 1-20    | --      | Second Reddit username            |
| `postsLimit`  | 20-200  | 50      | Posts to fetch per user           |
| `samplePairs` | 10-30   | 15      | Cross-product pairs sent to LLM  |
