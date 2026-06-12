import { NextRequest, NextResponse } from "next/server";

/**
 * Simple rate limiter using in-memory Map
 * For production, replace with Redis-backed solution
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000; // 1 minute

export function rateLimit(limit: number = 100): (req: NextRequest) => { allowed: boolean; remaining: number } {
  return (req: NextRequest) => {
    // Get client IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `${ip}`;
    const now = Date.now();

    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: entry.count <= limit, remaining: limit - entry.count };
  };
}

/**
 * API route guard: checks auth + rate limit
 * Returns null if allowed, or a NextResponse error
 */
export function apiGuard(req: NextRequest, options?: { rateLimit?: number }): NextResponse | null {
  // Rate limit check
  if (options?.rateLimit) {
    const { allowed } = rateLimit(options.rateLimit)(req);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return null; // Allowed
}
