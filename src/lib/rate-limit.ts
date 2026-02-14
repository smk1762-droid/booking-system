interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of cache) {
    if (entry.resetAt < now) {
      cache.delete(key);
    }
  }
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || entry.resetAt < now) {
    cache.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  const newCount = entry.count + 1;
  cache.set(key, { ...entry, count: newCount });

  if (newCount > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: limit - newCount, resetAt: entry.resetAt };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const RATE_LIMITS = {
  bookingCreate: { limit: 10, windowMs: 60 * 1000 },
  slotQuery: { limit: 30, windowMs: 60 * 1000 },
  tokenAction: { limit: 5, windowMs: 60 * 1000 },
  publicRead: { limit: 60, windowMs: 60 * 1000 },
} as const;
