import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/subscription/checkout/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: "user_123", email: "test@example.com" },
    })
  ),
}));

vi.mock("@/lib/payment", () => ({
  createCheckout: vi.fn((params: { tier: string }) =>
    Promise.resolve({
      checkoutUrl: `https://checkout.paddle.com/${params.tier}`,
      sessionId: `txn_${params.tier}`,
    })
  ),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 })),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/subscription/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create checkout URL for starter tier", async () => {
    const req = createRequest({ tier: "starter" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toContain("checkout.paddle.com");
  });

  it("should create checkout URL for professional tier", async () => {
    const req = createRequest({ tier: "professional" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toContain("checkout.paddle.com");
  });

  it("should create checkout URL for business tier", async () => {
    const req = createRequest({ tier: "business" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toContain("checkout.paddle.com");
  });

  it("should create checkout URL for enterprise tier", async () => {
    const req = createRequest({ tier: "enterprise" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toContain("checkout.paddle.com");
  });

  it("should reject invalid tier", async () => {
    const req = createRequest({ tier: "invalid_tier" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should reject unauthenticated requests", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null);

    const req = createRequest({ tier: "starter" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject requests without email", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user_123" },
    } as never);

    const req = createRequest({ tier: "starter" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should handle payment gateway errors", async () => {
    const { createCheckout } = await import("@/lib/payment");
    vi.mocked(createCheckout).mockRejectedValueOnce(
      new Error("Checkout creation failed")
    );

    const req = createRequest({ tier: "starter" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain("Checkout creation failed");
  });
});
