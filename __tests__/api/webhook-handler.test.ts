/**
 * FastSpring Webhook Handler Tests
 * Tests for the FastSpring webhook processing logic in lib/payment/webhook-handler.ts
 * Covers all subscription lifecycle events and edge cases
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockProcessedWebhookEventFindUnique = vi.fn();
const mockProcessedWebhookEventCreate = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    processedWebhookEvent: {
      findUnique: (...args: unknown[]) => mockProcessedWebhookEventFindUnique(...args),
      create: (...args: unknown[]) => mockProcessedWebhookEventCreate(...args),
    },
    subscription: {
      upsert: (...args: unknown[]) => mockSubscriptionUpsert(...args),
      updateMany: (...args: unknown[]) => mockSubscriptionUpdateMany(...args),
    },
  },
}));

// ─── Mock Audit ────────────────────────────────────────────────────
const mockCreateAuditLog = vi.fn();
vi.mock("@/lib/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { processWebhook, verifyWebhookSignature } from "@/lib/payment/webhook-handler";
import type { FastSpringWebhookPayload } from "@/lib/payment/types";

// ─── Test Helpers ──────────────────────────────────────────────────

function createWebhookPayload(
  eventType: string,
  overrides: Record<string, unknown> = {}
): FastSpringWebhookPayload {
  return {
    events: [
      {
        id: `evt-${Math.random().toString(36).slice(2)}`,
        type: eventType as never,
        created: Math.floor(Date.now() / 1000),
        data: {
          order: {
            id: "fs-order-123",
            reference: "order-ref-123",
            account: "user-123",
            total: 89.0,
            currency: "EUR",
            items: [
              {
                product: "professional-plan",
                quantity: 1,
                price: 89.0,
                subscription: "fs-sub-123",
              },
            ],
          },
          subscription: {
            id: "fs-sub-123",
            subscription: "fs-sub-123",
            account: "user-123",
            product: "professional-plan",
            quantity: 1,
            status: "active",
            begin: Math.floor(Date.now() / 1000),
            nextChargeDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
          ...overrides,
        },
      },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe("verifyWebhookSignature", () => {
  it("should return true when FASTSPRING_WEBHOOK_SECRET is not set", () => {
    delete process.env.FASTSPRING_WEBHOOK_SECRET;
    const result = verifyWebhookSignature("payload", "signature");
    expect(result).toBe(true);
  });

  it("should verify valid HMAC signature", () => {
    const secret = "test-secret";
    process.env.FASTSPRING_WEBHOOK_SECRET = secret;

    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update("payload", "utf8")
      .digest("hex");

    const result = verifyWebhookSignature("payload", expected);
    expect(result).toBe(true);
  });

  it("should reject invalid signature", () => {
    process.env.FASTSPRING_WEBHOOK_SECRET = "test-secret";
    const result = verifyWebhookSignature("payload", "invalid-signature");
    expect(result).toBe(false);
  });
});

describe("processWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessedWebhookEventFindUnique.mockReset();
    mockProcessedWebhookEventCreate.mockReset();
    mockSubscriptionUpsert.mockReset();
    mockSubscriptionUpdateMany.mockReset();
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  // ─── order.completed ─────────────────────────────────────────────

  describe("order.completed event", () => {
    it("should create subscription on order completed", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("order.completed");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-123" },
          create: expect.objectContaining({
            gateway: "fastspring",
            gatewayOrderId: "fs-order-123",
            tier: "professional",
            status: "active",
          }),
        })
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "payment_succeeded",
        })
      );
    });
  });

  // ─── subscription.activated ─────────────────────────────────────

  describe("subscription.activated event", () => {
    it("should upsert subscription on activation", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("subscription.activated");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-123" },
          create: expect.objectContaining({
            gateway: "fastspring",
            gatewaySubscriptionId: "fs-sub-123",
            tier: "professional",
            status: "active",
          }),
        })
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "subscription_created",
        })
      );
    });
  });

  // ─── subscription.updated ───────────────────────────────────────

  describe("subscription.updated event", () => {
    it("should update subscription on update event", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("subscription.updated");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewaySubscriptionId: "fs-sub-123" },
          data: expect.objectContaining({
            tier: "professional",
            status: "active",
          }),
        })
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "subscription_updated",
        })
      );
    });
  });

  // ─── subscription.canceled ──────────────────────────────────────

  describe("subscription.canceled event", () => {
    it("should set status to cancelled on cancel event", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("subscription.canceled");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewaySubscriptionId: "fs-sub-123" },
          data: expect.objectContaining({
            status: "cancelled",
            cancelledAt: expect.any(Date),
          }),
        })
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "subscription_cancelled",
        })
      );
    });
  });

  // ─── subscription.deactivated ───────────────────────────────────

  describe("subscription.deactivated event", () => {
    it("should set status to expired on deactivation", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("subscription.deactivated");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewaySubscriptionId: "fs-sub-123" },
          data: expect.objectContaining({
            status: "expired",
          }),
        })
      );
    });
  });

  // ─── subscription.payment.overdue ───────────────────────────────

  describe("subscription.payment.overdue event", () => {
    it("should set status to past_due on overdue", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload = createWebhookPayload("subscription.payment.overdue");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewaySubscriptionId: "fs-sub-123" },
          data: expect.objectContaining({
            status: "past_due",
          }),
        })
      );
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "payment_failed",
        })
      );
    });
  });

  // ─── return.created ─────────────────────────────────────────────

  describe("return.created event", () => {
    it("should cancel subscription on refund", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload: FastSpringWebhookPayload = {
        events: [
          {
            id: "evt-return",
            type: "return.created",
            created: Date.now(),
            data: {
              return: {
                id: "fs-return-123",
                order: "fs-order-123",
                account: "user-123",
                total: 89.0,
                currency: "EUR",
              },
            },
          },
        ],
      };
      const result = await processWebhook(payload);

      expect(result.processed).toBe(1);
      expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewayOrderId: "fs-order-123" },
          data: expect.objectContaining({
            status: "cancelled",
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });
  });

  // ─── Idempotency ────────────────────────────────────────────────

  describe("idempotency", () => {
    it("should skip already processed events", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue({ id: "evt-1", eventId: "evt-1" });

      const payload = createWebhookPayload("order.completed");
      const result = await processWebhook(payload);

      expect(result.processed).toBe(0);
      expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should handle missing data gracefully", async () => {
      mockProcessedWebhookEventFindUnique.mockResolvedValue(null);
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload: FastSpringWebhookPayload = {
        events: [
          {
            id: "evt-empty",
            type: "order.completed",
            created: Date.now(),
            data: {},
          },
        ],
      };

      const result = await processWebhook(payload);
      expect(result.processed).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it("should continue processing on single event error", async () => {
      mockProcessedWebhookEventFindUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockSubscriptionUpsert.mockRejectedValue(new Error("DB error"));
      mockProcessedWebhookEventCreate.mockResolvedValue({ id: "evt-1" });

      const payload: FastSpringWebhookPayload = {
        events: [
          {
            id: "evt-1",
            type: "order.completed",
            created: Date.now(),
            data: {
              order: {
                id: "order-1",
                reference: "ref-1",
                account: "user-1",
                total: 89,
                currency: "EUR",
                items: [{ product: "professional-plan", quantity: 1, price: 89 }],
              },
            },
          },
          {
            id: "evt-2",
            type: "subscription.canceled",
            created: Date.now(),
            data: {
              subscription: {
                id: "sub-2",
                subscription: "sub-2",
                account: "user-2",
                product: "starter-plan",
                quantity: 1,
                status: "canceled",
                begin: Date.now(),
                nextChargeDate: Date.now(),
              },
            },
          },
        ],
      };

      const result = await processWebhook(payload);
      expect(result.processed).toBe(1); // Second event processed
      expect(result.errors).toHaveLength(1); // First event failed
    });
  });
});
