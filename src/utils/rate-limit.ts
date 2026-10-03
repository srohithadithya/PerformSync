// A simple in-memory rate limiter for serverless environments.
// Note: In a highly distributed production environment, a Redis-based solution (e.g. @upstash/ratelimit) is recommended.
// This provides basic protection against bots and spam on a per-instance basis.

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (now - record.lastReset > windowMs) {
    // Window expired, reset
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  record.count += 1;
  return true;
}
