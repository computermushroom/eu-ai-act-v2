import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as checkoutHandler } from "@/app/api/subscription/checkout/route";
import { POST as webhookHandler } from "@/app/api/payment/webhook/fastspring/route";
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

// ─── Mock Payment Module ────────────────────────────────────────────
const mockCreateCheckout = vi.fn();
const mockVerifyWebhook = vi.fn();
const mockProcessWebhookData = vi.fn();

vi.mock("@/lib/payment", () => ({
  createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
  verifyWebhook: (...args: unknown[]) => mockVerifyWebhook(...args),
  processWebhookData: (...args: unknown[]) => mockProcessWebhookData(...args),
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
    mockCreateCheckout.mockResolvedValue({
      checkoutUrl: "https://fastspring.com/checkout/test",
      sessionId: "txn_123",
    });

    const req = createJsonRequest({ tier: "professional" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://fastspring.com/checkout/test");
    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: "professional",
        userEmail: "test@example.com",
      })
    );
  });

  it("should reject unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    const req = createJsonRequest({ tier: "professional" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockCreateCheckout).not.toHaveBeenCalled();
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

  it("should handle payment gateway errors", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });
    mockCreateCheckout.mockRejectedValue(new Error("Product path not configured"));

    const req = createJsonRequest({ tier: "enterprise" });
    const res = await checkoutHandler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Product path not configured");
  });
});

describe("FastSpring Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process valid FastSpring webhook", async () => {
    mockVerifyWebhook.mockResolvedValue({
      valid: true,
      event: "order.completed",
      data: {
        gateway: "fastspring",
        gatewaySubscriptionId: "sub_123",
        gatewayCustomerId: "ctm_123",
        gatewayProductId: "path_123",
        gatewayOrderId: "ord_123",
        customerEmail: "test@example.com",
        tier: "professional",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        testMode: true,
        rawEvent: "order.completed",
      },
    });
    mockProcessWebhookData.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/payment/webhook/fastspring", {
      method: "POST",
      body: JSON.stringify({ event: "order.completed", data: {} }),
      headers: {
        "Content-Type": "application/json",
        "X-FS-Signature": "validsignature",
      },
    });

    const res = await webhookHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(mockProcessWebhookData).toHaveBeenCalled();
  });

  it("should reject invalid FastSpring signature", async () => {
    mockVerifyWebhook.mockResolvedValue({
      valid: false,
      event: "order.completed",
      data: {
        gateway: "fastspring",
        gatewaySubscriptionId: "",
        gatewayCustomerId: "",
        gatewayProductId: "",
        gatewayOrderId: "",
        customerEmail: "",
        tier: "starter",
        status: "inactive",
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        testMode: false,
        rawEvent: "",
      },
    });

    const req = new NextRequest("http://localhost/api/payment/webhook/fastspring", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(401);
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
