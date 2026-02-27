-- Semantic Compatibility Engine - Database Schema
-- Target: PostgreSQL 14+ (Neon / Railway / Render)
-- Run this once to initialize the database.

-- =============================================
-- ANALYSES TABLE
-- Stores every compatibility analysis result.
-- =============================================
CREATE TABLE IF NOT EXISTS analyses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a          TEXT NOT NULL,
    user_b          TEXT NOT NULL,
    posts_fetched_a INT NOT NULL DEFAULT 0,
    posts_fetched_b INT NOT NULL DEFAULT 0,
    pairs_analyzed  INT NOT NULL DEFAULT 0,
    provider        TEXT NOT NULL DEFAULT 'groq',
    report_json     JSONB NOT NULL,
    latency_ms      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache lookups: find recent analyses for a user pair
-- User pair is always normalized (alphabetically sorted) before insertion
CREATE INDEX IF NOT EXISTS idx_analyses_users 
    ON analyses (user_a, user_b);

-- Index for historical queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_analyses_created 
    ON analyses (created_at DESC);

-- =============================================
-- CACHE LOOKUP QUERY (for reference)
-- =============================================
-- SELECT id, user_a, user_b, posts_fetched_a, posts_fetched_b,
--        pairs_analyzed, provider, report_json, latency_ms, created_at
-- FROM analyses
-- WHERE user_a = $1 AND user_b = $2
--   AND created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- =============================================
-- ANALYTICS QUERIES (for reference)
-- =============================================

-- Total analyses run
-- SELECT COUNT(*) FROM analyses;

-- Most analyzed user pairs
-- SELECT user_a, user_b, COUNT(*) as analysis_count
-- FROM analyses
-- GROUP BY user_a, user_b
-- ORDER BY analysis_count DESC
-- LIMIT 20;

-- Average latency
-- SELECT AVG(latency_ms) as avg_latency, 
--        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
-- FROM analyses;

-- Analyses per day
-- SELECT DATE(created_at) as day, COUNT(*) as count
-- FROM analyses
-- GROUP BY DATE(created_at)
-- ORDER BY day DESC;
