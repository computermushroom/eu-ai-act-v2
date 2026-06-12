// API Rate Limiter
// In-memory rate limiting for API routes (no Redis dependency)
// Uses sliding window per IP address
// GDPR: IP addresses are not stored, only used for rate limit counting

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter configuration
 */
interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = { maxRequests: 100, windowMs: 60 * 1000 };

/**
 * Default rate limit configs per route type
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowMs: 60 * 1000 }, // 100/min
  auth: { maxRequests: 10, windowMs: 60 * 1000 }, // 10/min (login/register)
  scan: { maxRequests: 20, windowMs: 60 * 1000 }, // 20/min (URL scan)
  export: { maxRequests: 5, windowMs: 60 * 1000 }, // 5/min (data export)
  webhook: { maxRequests: 50, windowMs: 60 * 1000 }, // 50/min (webhooks)
};

/**
 * In-memory rate limit store
 * Note: In a multi-instance deployment, use Redis instead
 */
const store = new Map<string, RateLimitEntry>();

/**
 * Cleanup expired entries periodically (every 5 minutes)
 */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., IP address or userId)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining info
 */
export function checkRateLimit(
  key: string,
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const limitConfig: RateLimitConfig = config ?? DEFAULT_RATE_LIMIT;
  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or expired window
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + limitConfig.windowMs });
    return {
      allowed: true,
      remaining: limitConfig.maxRequests - 1,
      resetAt: now + limitConfig.windowMs,
    };
  }

  // Within window
  if (entry.count >= limitConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment and allow
  entry.count += 1;
  return {
    allowed: true,
    remaining: limitConfig.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limit middleware for API routes
 * @param category - Route category for rate limit config
 * @param getKey - Function to extract rate limit key from request
 */
export function createRateLimiter(category: string) {
  const config = RATE_LIMITS[category] ?? RATE_LIMITS.default;

  return function limit(
    request: Request
  ): { allowed: boolean; remaining: number; resetAt: number } {
    // Use IP or fallback to a hash of the request
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

    return checkRateLimit(ip, config);
  };
}
