import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/lemonsqueezy/webhook/route";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

vi.mock("crypto", () => ({
  createHmac: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => "valid_signature"),
    })),
  })),
}));

function createWebhookRequest(body: unknown, signature?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (signature) {
    headers.set("x-signature", signature);
  }
  return new Request("http://localhost/api/lemonsqueezy/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/lemonsqueezy/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockReset();
    mockUpsert.mockReset();
  });

  it("should reject missing signature", async () => {
    const req = createWebhookRequest({ event: "subscription_created" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Missing signature");
  });

  it("should reject invalid signature", async () => {
    const req = createWebhookRequest(
      { event: "subscription_created" },
      "invalid_signature"
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Invalid signature");
  });

  it("should process subscription_created event", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      status: "inactive",
      tier: "free",
    });
    mockUpsert.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      status: "active",
      tier: "professional",
    });

    const payload = {
      meta: {
        custom_data: { userId: "user_123" },
      },
      data: {
        id: "ls_sub_456",
        type: "subscriptions",
        attributes: {
          variant_id: 123456,
          status: "active",
          product_id: "prod_789",
          order_id: "order_abc",
          customer_id: "cust_def",
          renews_at: "2026-07-12T00:00:00Z",
          ends_at: null,
          trial_ends_at: null,
          card_brand: "visa",
          card_last_four: "4242",
        },
      },
    };

    const req = createWebhookRequest(payload, "valid_signature");

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("should process subscription_cancelled event", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      status: "active",
      tier: "professional",
    });
    mockUpsert.mockResolvedValue({
      id: "sub_123",
      userId: "user_123",
      status: "cancelled",
      tier: "professional",
    });

    const payload = {
      meta: {
        custom_data: { userId: "user_123" },
      },
      data: {
        id: "ls_sub_456",
        type: "subscriptions",
        attributes: {
          variant_id: 123456,
          status: "cancelled",
          product_id: "prod_789",
          order_id: "order_abc",
          customer_id: "cust_def",
          renews_at: "2026-07-12T00:00:00Z",
          ends_at: "2026-07-12T00:00:00Z",
          trial_ends_at: null,
          card_brand: "visa",
          card_last_four: "4242",
        },
      },
    };

    const req = createWebhookRequest(payload, "valid_signature");

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("should reject unknown event types", async () => {
    const payload = {
      meta: {
        custom_data: { userId: "user_123" },
      },
      data: {
        id: "ls_sub_456",
        type: "subscriptions",
        attributes: {
          variant_id: 123456,
          status: "active",
        },
      },
    };

    const req = createWebhookRequest(payload, "valid_signature");

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain("Unhandled event");
  });

  it("should handle missing custom_data", async () => {
    const payload = {
      meta: {},
      data: {
        id: "ls_sub_456",
        type: "subscriptions",
        attributes: {
          variant_id: 123456,
          status: "active",
        },
      },
    };

    const req = createWebhookRequest(payload, "valid_signature");

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Missing user ID");
  });
});
