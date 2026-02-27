/**
 * Rate Limiter
 *
 * Simple in-memory sliding window rate limiter for Vercel serverless.
 * Limits requests per IP address within a configurable time window.
 */

const requests = new Map<string, number[]>();

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);

/**
 * Check if a request from the given IP should be rate-limited.
 *
 * @returns Object with `allowed` boolean and `remaining` count.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing requests for this IP, filter to current window
  const existing = (requests.get(ip) || []).filter((t) => t > windowStart);

  if (existing.length >= MAX_REQUESTS) {
    const oldestInWindow = existing[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + WINDOW_MS - now,
    };
  }

  // Record this request
  existing.push(now);
  requests.set(ip, existing);

  // Periodic cleanup: remove expired IPs
  if (Math.random() < 0.05) {
    for (const [key, timestamps] of requests) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, active);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.length,
    resetMs: WINDOW_MS,
  };
}
