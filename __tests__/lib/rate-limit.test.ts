import { describe, it, expect, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

// Mock NextRequest
function createMockRequest(ip: string) {
  return {
    ip,
    headers: new Headers(),
  } as unknown as import("next/server").NextRequest;
}

describe("Rate Limiter", () => {
  it("should allow requests within limit", () => {
    const limiter = createRateLimiter("test");
    const req = createMockRequest("192.168.1.1");

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = limiter(req);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i - 1);
    }
  });

  it("should block requests exceeding limit", () => {
    const limiter = createRateLimiter("test");
    const req = createMockRequest("192.168.1.2");

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      limiter(req);
    }

    // 6th request should be blocked
    const result = limiter(req);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("should track different IPs separately", () => {
    const limiter = createRateLimiter("test");
    const req1 = createMockRequest("192.168.1.3");
    const req2 = createMockRequest("192.168.1.4");

    // Exhaust limit for IP 1
    for (let i = 0; i < 5; i++) {
      limiter(req1);
    }

    expect(limiter(req1).allowed).toBe(false);
    expect(limiter(req2).allowed).toBe(true);
  });

  it("should use different namespaces independently", () => {
    const authLimiter = createRateLimiter("auth");
    const scanLimiter = createRateLimiter("scan");
    const req = createMockRequest("192.168.1.5");

    // Auth limit: 10, Scan limit: 5
    for (let i = 0; i < 5; i++) {
      expect(authLimiter(req).allowed).toBe(true);
      expect(scanLimiter(req).allowed).toBe(true);
    }

    // 6th scan request blocked, auth still allowed
    expect(scanLimiter(req).allowed).toBe(false);
    expect(authLimiter(req).allowed).toBe(true);
  });
});
