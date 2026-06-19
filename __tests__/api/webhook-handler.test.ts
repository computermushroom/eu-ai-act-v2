/**
 * Webhook Handler Tests
 * Tests for the unified webhook processing logic in lib/payment/webhook-handler.ts
 * Covers all subscription lifecycle events and edge cases
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockUserFindUnique = vi.fn();
const mockUserFindFirst = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionUpdate = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
    },
    subscription: {
      upsert: (...args: unknown[]) => mockSubscriptionUpsert(...args),
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
      findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
    },
  },
}));

// ─── Mock Audit ────────────────────────────────────────────────────
const mockCreateAuditLog = vi.fn();
vi.mock("@/lib/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { processWebhookData } from "@/lib/payment/webhook-handler";
import type { UnifiedSubscriptionData } from "@/lib/payment/types";

// ─── Test Helpers ──────────────────────────────────────────────────

function createWebhookData(
  overrides: Partial<UnifiedSubscriptionData> = {}
): UnifiedSubscriptionData {
  return {
    gateway: "creem",
    gatewaySubscriptionId: "gw-sub-123",
    gatewayCustomerId: "gw-cust-123",
    gatewayProductId: "gw-prod-123",
    gatewayOrderId: "gw-order-123",
    customerEmail: "test@example.com",
    tier: "professional",
    status: "active",
    currentPeriodStart: new Date("2025-01-01"),
    currentPeriodEnd: new Date("2025-02-01"),
    testMode: false,
    rawEvent: "subscription_created",
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe("processWebhookData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserFindUnique.mockReset();
    mockSubscriptionUpsert.mockReset();
    mockSubscriptionUpdate.mockReset();
    mockSubscriptionFindFirst.mockReset();
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  // ─── subscription_created ────────────────────────────────────────

  describe("subscription_created event", () => {
    it("should call subscription upsert and create audit log", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockSubscription = {
        id: "sub-123",
        userId: "user-123",
        tier: "professional",
        status: "active",
      };

      mockUserFindUnique.mockResolvedValue(mockUser);
      mockSubscriptionUpsert.mockResolvedValue(mockSubscription);

      const data = createWebhookData({ rawEvent: "subscription_created" });
      await processWebhookData(data);

      // upsert should be called to create/update subscription
      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gatewaySubscriptionId: "gw-sub-123" },
          create: expect.objectContaining({
            userId: "user-123",
            tier: "professional",
            status: "active",
          }),
        })
      );

      // audit log should be created
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          action: "subscription_created",
          resource: "subscription",
        })
      );
    });

    it("should set cancelledAt to null for new subscriptions", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({ rawEvent: "subscription_created" });
      await processWebhookData(data);

      expect(mockSubscriptionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ cancelledAt: null }),
        })
      );
    });
  });

  // ─── subscription_cancelled ─────────────────────────────────────

  describe("subscription_cancelled event", () => {
    it("should set cancelledAt on the subscription", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_cancelled",
        status: "cancelled",
        currentPeriodEnd: new Date("2025-03-01"),
      });
      await processWebhookData(data);

      // handleSubscriptionCancelled should be called via update
      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-123" },
          data: expect.objectContaining({
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });

    it("should set status to cancelled when period has not expired", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const futureEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const data = createWebhookData({
        rawEvent: "subscription_cancelled",
        status: "cancelled",
        currentPeriodEnd: futureEnd,
      });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "cancelled" }),
        })
      );
    });
  });

  // ─── subscription_expired ───────────────────────────────────────

  describe("subscription_expired event", () => {
    it("should downgrade tier to free", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_expired",
        status: "expired",
      });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-123" },
          data: expect.objectContaining({
            tier: "free",
            status: "expired",
          }),
        })
      );
    });

    it("should set cancelledAt on expiry", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_expired",
        status: "expired",
      });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });
  });

  // ─── subscription_payment_failed ────────────────────────────────

  describe("subscription_payment_failed event", () => {
    it("should set status to past_due", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_payment_failed",
        status: "past_due",
      });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-123" },
          data: expect.objectContaining({ status: "past_due" }),
        })
      );
    });

    it("should create audit log with payment_failed action", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_payment_failed",
        status: "past_due",
      });
      await processWebhookData(data);

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "payment_failed",
        })
      );
    });
  });

  // ─── subscription_refunded ───────────────────────────────────────

  describe("subscription_refunded event", () => {
    it("should downgrade tier to free and set status to cancelled", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_refunded",
        status: "cancelled",
      });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-123" },
          data: expect.objectContaining({
            tier: "free",
            status: "cancelled",
            cancelledAt: expect.any(Date),
          }),
        })
      );
    });

    it("should create audit log with subscription_cancelled action", async () => {
      mockUserFindUnique.mockResolvedValue({ id: "user-123", email: "test@example.com" });
      mockSubscriptionUpsert.mockResolvedValue({ id: "sub-123" });
      mockSubscriptionUpdate.mockResolvedValue({ id: "sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_refunded",
        status: "cancelled",
      });
      await processWebhookData(data);

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "subscription_cancelled",
        })
      );
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should skip processing when gatewaySubscriptionId is missing", async () => {
      const data = createWebhookData({ gatewaySubscriptionId: "" });

      await processWebhookData(data);

      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("should skip processing when customerEmail is missing", async () => {
      const data = createWebhookData({ customerEmail: "" });

      await processWebhookData(data);

      expect(mockUserFindUnique).not.toHaveBeenCalled();
      expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("should handle orphan subscription when user does not exist", async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockSubscriptionFindFirst.mockResolvedValue({
        id: "orphan-sub-123",
        userId: "deleted-user-456",
      });
      mockSubscriptionUpdate.mockResolvedValue({ id: "orphan-sub-123" });

      const data = createWebhookData({
        rawEvent: "subscription_cancelled",
        status: "cancelled",
      });
      await processWebhookData(data);

      // Should attempt to find existing subscription by gateway ID
      expect(mockSubscriptionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gatewaySubscriptionId: "gw-sub-123",
          }),
        })
      );

      // Should update the orphan subscription
      expect(mockSubscriptionUpdate).toHaveBeenCalled();

      // Should NOT create audit log (no user to associate with)
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("should skip orphan update when no existing subscription found", async () => {
      mockUserFindUnique.mockResolvedValue(null);
      mockSubscriptionFindFirst.mockResolvedValue(null);

      const data = createWebhookData({ rawEvent: "subscription_created" });
      await processWebhookData(data);

      expect(mockSubscriptionUpdate).not.toHaveBeenCalled();
      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it("should re-throw error on database failure", async () => {
      mockUserFindUnique.mockRejectedValue(new Error("Database connection lost"));

      const data = createWebhookData({ rawEvent: "subscription_created" });

      await expect(processWebhookData(data)).rejects.toThrow("Database connection lost");
    });
  });
});
