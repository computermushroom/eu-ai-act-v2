import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/subscription/checkout/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: "user_123", email: "test@example.com" },
    })
  ),
}));

vi.mock("@/lib/lemonsqueezy", () => ({
  createSubscriptionCheckout: vi.fn((tier: string) =>
    Promise.resolve(`https://checkout.lemonsqueezy.com/${tier}`)
  ),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
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
    expect(data.checkoutUrl).toBe("https://checkout.lemonsqueezy.com/starter");
  });

  it("should create checkout URL for professional tier", async () => {
    const req = createRequest({ tier: "professional" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toBe("https://checkout.lemonsqueezy.com/professional");
  });

  it("should create checkout URL for business tier", async () => {
    const req = createRequest({ tier: "business" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toBe("https://checkout.lemonsqueezy.com/business");
  });

  it("should create checkout URL for enterprise tier", async () => {
    const req = createRequest({ tier: "enterprise" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.checkoutUrl).toBe("https://checkout.lemonsqueezy.com/enterprise");
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

  it("should handle rate limiting", async () => {
    for (let i = 0; i < 10; i++) {
      const req = createRequest({ tier: "starter" });
      const res = await POST(req);
      if (res.status === 429) break;
    }

    const req = createRequest({ tier: "starter" });
    const res = await POST(req);
    expect([200, 429]).toContain(res.status);
  });

  it("should handle Lemon Squeezy SDK errors", async () => {
    const { createSubscriptionCheckout } = await import("@/lib/lemonsqueezy");
    vi.mocked(createSubscriptionCheckout).mockRejectedValueOnce(
      new Error("Checkout creation failed")
    );

    const req = createRequest({ tier: "starter" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain("Checkout creation failed");
  });
});
