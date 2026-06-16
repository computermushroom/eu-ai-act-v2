import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as checkoutHandler } from "@/app/api/subscription/checkout/route";
import { POST as webhookHandler } from "@/app/api/payment/webhook/route";
import { requireTier } from "@/lib/subscription-guard";

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockSubscriptionFindUnique = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
      upsert: (...args: unknown[]) => mockSubscriptionUpsert(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

// ─── Mock Auth ─────────────────────────────────────────────────────
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// ─── Mock Audit ────────────────────────────────────────────────────
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

// ─── Mock Rate Limiter ─────────────────────────────────────────────
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 })),
}));

// ─── Mock Payment Gateway ────────────────────────────────────────────
const mockCreateSubscriptionCheckout = vi.fn();
vi.mock("@/lib/payment", () => ({
  createSubscriptionCheckout: (...args: unknown[]) => mockCreateSubscriptionCheckout(...args),
  verifyWebhookSignature: vi.fn(() => true),
}));

function createJsonRequest(body: unknown, opts?: { headers?: Record<string, string> }): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
}

describe("Subscription API - Checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create checkout URL for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockCreateSubscriptionCheckout.mockResolvedValue("https://checkout.creem.io/test");

    const req = createJsonRequest({ tier: "professional" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://checkout.creem.io/test");
    expect(mockCreateSubscriptionCheckout).toHaveBeenCalledWith(
      "professional",
      "test@example.com",
      expect.any(String)
    );
  });

  it("should reject unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    const req = createJsonRequest({ tier: "professional" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCreateSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it("should reject invalid tier", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });

    const req = createJsonRequest({ tier: "invalid-tier" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("should handle payment gateway SDK errors", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockCreateSubscriptionCheckout.mockRejectedValue(new Error("Variant ID not configured"));

    const req = createJsonRequest({ tier: "enterprise" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Variant ID not configured");
  });
});

describe("Subscription API - Webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    meta: { event_name: "subscription_created" },
    data: {
      id: "sub-123",
      type: "subscriptions",
      attributes: {
        store_id: 12345,
        customer_id: 67890,
        order_id: 11111,
        order_item_id: 22222,
        product_id: 33333,
        variant_id: 44444,
        product_name: "Professional Plan",
        variant_name: "Professional Monthly",
        user_name: "Test User",
        user_email: "test@example.com",
        status: "active",
        status_formatted: "Active",
        card_brand: "visa",
        card_last_four: "4242",
        pause: null,
        cancelled: false,
        trial_ends_at: null,
        billing_anchor: 1,
        first_subscription_item: {
          id: 1,
          subscription_id: 1,
          price_id: 1,
          quantity: 1,
          is_usage_based: false,
        },
        urls: { update_payment_method: "https://example.com/update" },
        renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        test_mode: true,
      },
    },
  };

  it("should process subscription_created webhook", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockSubscriptionUpsert.mockResolvedValue({ id: "local-sub-123" });

    const req = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: {
        "Content-Type": "application/json",
        "X-Signature": "valid-signature",
      },
    });

    const res = await webhookHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockSubscriptionUpsert).toHaveBeenCalled();
  });

  it("should handle subscription_cancelled event", async () => {
    const cancelledPayload = {
      ...validPayload,
      meta: { event_name: "subscription_cancelled" },
    };

    mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockSubscriptionUpdate.mockResolvedValue({ id: "local-sub-123", status: "cancelled" });

    const req = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      body: JSON.stringify(cancelledPayload),
      headers: {
        "Content-Type": "application/json",
        "X-Signature": "valid-signature",
      },
    });

    const res = await webhookHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    );
  });

  it("should reject missing signature", async () => {
    const req = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await webhookHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain("Missing signature");
  });

  it("should reject user not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      body: JSON.stringify(validPayload),
      headers: {
        "Content-Type": "application/json",
        "X-Signature": "valid-signature",
      },
    });

    const res = await webhookHandler(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain("User not found");
  });
});

describe("Subscription Guard - requireTier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access for sufficient tier", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "user-123",
      status: "active",
      tier: "business",
    });

    const guard = requireTier("professional");
    const req = new NextRequest("http://localhost/api/test");
    const result = await guard(req);

    expect(result).toBeNull();
  });

  it("should block access for insufficient tier", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "user-123",
      status: "active",
      tier: "starter",
    });

    const guard = requireTier("professional");
    const req = new NextRequest("http://localhost/api/test");
    const result = await guard(req);

    expect(result).not.toBeNull();
    if (result) {
      const body = await result.json();
      expect(body.error).toContain("Upgrade required");
    }
  });

  it("should block access for inactive subscription", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "user-123",
      status: "inactive",
      tier: "free",
    });

    const guard = requireTier("starter");
    const req = new NextRequest("http://localhost/api/test");
    const result = await guard(req);

    expect(result).not.toBeNull();
    if (result) {
      const body = await result.json();
      expect(body.error).toContain("Upgrade required");
    }
  });

  it("should allow free tier access for free tools", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "user-123",
      status: "inactive",
      tier: "free",
    });

    const guard = requireTier("free");
    const req = new NextRequest("http://localhost/api/test");
    const result = await guard(req);

    expect(result).toBeNull();
  });

  it("should block unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    const guard = requireTier("free");
    const req = new NextRequest("http://localhost/api/test");
    const result = await guard(req);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.status).toBe(401);
    }
  });
});
