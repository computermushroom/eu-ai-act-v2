// Unified Webhook Handler
// Processes standardized webhook data from any payment gateway
// Writes subscription updates to the database via Prisma
// Idempotent: uses gateway + gatewaySubscriptionId for deduplication
// Writes audit logs for all subscription state changes
// Records payment_provider on every subscription for financial reconciliation

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
} from "@/lib/email";
import type {
  UnifiedSubscriptionData,
  UnifiedWebhookEvent,
  PaymentGatewayType,
  PaymentTier,
} from "./types";
import type { AuditAction, SubscriptionStatus, SubscriptionTier } from "@prisma/client";

// ============================================================
// Tier Mapping
// ============================================================

/**
 * Maps unified PaymentTier to Prisma SubscriptionTier enum.
 * PaymentTier does not include "free" (that is the default absence of subscription).
 */
function mapToPrismaTier(tier: PaymentTier): SubscriptionTier {
  const tierMap: Record<PaymentTier, SubscriptionTier> = {
    starter: "starter",
    professional: "professional",
    business: "business",
    enterprise: "enterprise",
  };
  return tierMap[tier];
}

/**
 * Maps unified subscription status to Prisma SubscriptionStatus enum.
 */
function mapToPrismaStatus(status: string): SubscriptionStatus {
  const validStatuses: SubscriptionStatus[] = [
    "active",
    "cancelled",
    "expired",
    "inactive",
    "past_due",
    "paused",
    "unpaid",
  ];
  if (validStatuses.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }
  return "inactive";
}

// ============================================================
// Audit Action Mapping
// ============================================================

/**
 * Maps unified webhook events to audit log actions.
 */
function mapToAuditAction(event: UnifiedWebhookEvent): AuditAction {
  const actionMap: Record<UnifiedWebhookEvent, AuditAction> = {
    subscription_created: "subscription_created",
    subscription_updated: "subscription_updated",
    subscription_cancelled: "subscription_cancelled",
    subscription_resumed: "subscription_updated",
    subscription_expired: "subscription_cancelled",
    subscription_paused: "subscription_updated",
    subscription_unpaused: "subscription_updated",
    subscription_payment_success: "payment_succeeded",
    subscription_payment_failed: "payment_failed",
    subscription_payment_recovered: "payment_succeeded",
    subscription_refunded: "subscription_cancelled",
  };
  return actionMap[event];
}

// ============================================================
// Gateway Field Mapping
// ============================================================

/**
 * Maps unified gateway type to the correct database fields.
 * Each gateway stores its IDs in different columns.
 */
interface GatewayFieldMapping {
  subscriptionIdField: string;
  customerIdField: string;
  productIdField: string;
  orderIdField: string;
}

function getGatewayFieldMapping(_gateway: PaymentGatewayType): GatewayFieldMapping {
  // All gateways now use the unified gateway* fields
  return {
    subscriptionIdField: "gatewaySubscriptionId",
    customerIdField: "gatewayCustomerId",
    productIdField: "gatewayProductId",
    orderIdField: "gatewayOrderId",
  };
}

// ============================================================
// Event-specific Handlers
// ============================================================

/**
 * Handle subscription_created event.
 * Creates or updates subscription, sends welcome email.
 */
async function handleSubscriptionCreated(
  userId: string,
  subscriptionId: string,
  prismaTier: SubscriptionTier,
  prismaStatus: SubscriptionStatus,
  currentPeriodStart: Date,
  currentPeriodEnd: Date | null,
  gatewayCustomerId: string,
  gatewayProductId: string,
  gatewayOrderId: string,
  customerEmail: string
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      gatewayCustomerId,
      gatewayProductId,
      gatewayOrderId,
      tier: prismaTier,
      status: prismaStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelledAt: null,
    },
  });

  // Send welcome email (fire-and-forget, non-blocking)
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const userName = user?.name ?? "User";
    void sendWelcomeEmail(customerEmail, userName).catch((err) => {
      console.error("[WebhookHandler] Failed to send welcome email:", err);
    });
  } catch (err) {
    console.error("[WebhookHandler] Failed to fetch user for welcome email:", err);
  }
}

/**
 * Handle subscription_cancelled event.
 * Sets cancelledAt, downgrades to free if already expired.
 */
async function handleSubscriptionCancelled(
  subscriptionId: string,
  currentPeriodEnd: Date | null
): Promise<void> {
  const now = new Date();
  const isExpired = currentPeriodEnd ? currentPeriodEnd < now : true;

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: isExpired ? "inactive" : "cancelled",
      cancelledAt: now,
      tier: isExpired ? "free" : undefined,
    },
  });
}

/**
 * Handle subscription_expired event.
 * Downgrades subscription to free tier.
 */
async function handleSubscriptionExpired(
  subscriptionId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "expired",
      tier: "free",
      cancelledAt: new Date(),
    },
  });
}

/**
 * Handle subscription_payment_failed event.
 * Marks subscription as past_due, sends payment failed reminder.
 */
async function handleSubscriptionPaymentFailed(
  subscriptionId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "past_due",
    },
  });

  // Send payment failed reminder (fire-and-forget, non-blocking)
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        tier: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });
    if (subscription?.user.email) {
      const userName = subscription.user.name ?? "User";
      void sendPaymentFailedEmail(
        subscription.user.email,
        userName,
        subscription.tier
      ).catch((err) => {
        console.error("[WebhookHandler] Failed to send payment failed email:", err);
      });
    }
  } catch (err) {
    console.error("[WebhookHandler] Failed to fetch subscription for payment failed email:", err);
  }
}

/**
 * Handle subscription_refunded event.
 * Marks subscription as refunded, downgrades to free, sends refund notification.
 */
async function handleSubscriptionRefunded(
  subscriptionId: string
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      tier: "free",
      cancelledAt: new Date(),
    },
  });

  // Send refund notification (fire-and-forget, non-blocking)
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        tier: true,
        user: {
          select: { email: true, name: true },
        },
      },
    });
    if (subscription?.user.email) {
      const userName = subscription.user.name ?? "User";
      void sendRefundEmail(
        subscription.user.email,
        userName,
        subscription.tier
      ).catch((err) => {
        console.error("[WebhookHandler] Failed to send refund email:", err);
      });
    }
  } catch (err) {
    console.error("[WebhookHandler] Failed to fetch subscription for refund email:", err);
  }
}

// ============================================================
// Webhook Processing
// ============================================================

/**
 * Process unified webhook data and write to database.
 * This is the main entry point after webhook verification.
 *
 * Handles all event types with differentiated logic:
 * - subscription_created: Creates/updates subscription, sends welcome email
 * - subscription_updated: Updates subscription status/tier
 * - subscription_cancelled: Sets cancelledAt, downgrades to free if expired
 * - subscription_expired: Downgrades to free tier
 * - subscription_paused: Marks subscription as paused
 * - subscription_payment_failed: Marks as past_due, sends payment failed reminder
 * - subscription_refunded: Marks as refunded, downgrades to free, sends refund notification
 *
 * Idempotent: Uses gateway + gatewaySubscriptionId for unique identification.
 * If a subscription with the same gateway ID already exists, it will be updated
 * rather than creating a duplicate.
 *
 * @param data - Standardized subscription data from the payment gateway
 */
export async function processWebhookData(
  data: UnifiedSubscriptionData
): Promise<void> {
  const {
    gateway,
    gatewaySubscriptionId,
    gatewayCustomerId,
    gatewayProductId,
    gatewayOrderId,
    customerEmail,
    tier,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    testMode,
    rawEvent,
  } = data;

  // Guard: Skip processing if essential fields are missing
  if (!gatewaySubscriptionId || !customerEmail) {
    console.warn(
      `[WebhookHandler] Skipping webhook: missing subscription ID or email`,
      { gateway, rawEvent, gatewaySubscriptionId, customerEmail }
    );
    return;
  }

  // Map unified types to Prisma enums
  const prismaTier = mapToPrismaTier(tier);
  const prismaStatus = mapToPrismaStatus(status);
  const fieldMapping = getGatewayFieldMapping(gateway);

  try {
    // Find user by email to link subscription
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      console.warn(
        `[WebhookHandler] User not found for email: ${customerEmail}. ` +
        `Subscription will not be linked.`
      );
      // Still attempt to find existing subscription by gateway ID
      // but skip creating a new one since we have no user
      await updateExistingSubscription(
        gatewaySubscriptionId,
        fieldMapping,
        prismaTier,
        prismaStatus,
        currentPeriodStart,
        currentPeriodEnd,
        gatewayCustomerId,
        gatewayProductId,
        gatewayOrderId,
        rawEvent
      );
      return;
    }

    // Upsert subscription record
    // Uses gateway subscription ID for idempotency
    // All gateways use the unified gatewaySubscriptionId field
    // paymentProvider is set on creation and never changed (data isolation rule)
    const subscription = await prisma.subscription.upsert({
      where: {
        gatewaySubscriptionId: gatewaySubscriptionId,
      },
      create: {
        userId: user.id,
        gatewaySubscriptionId: gatewaySubscriptionId,
        gatewayCustomerId: gatewayCustomerId,
        gatewayProductId: gatewayProductId,
        gatewayOrderId: gatewayOrderId,
        tier: prismaTier,
        status: prismaStatus,
        currentPeriodStart,
        currentPeriodEnd,
        cancelledAt: prismaStatus === "cancelled" ? new Date() : null,
        paymentProvider: gateway,
        gateway: gateway,
      },
      update: {
        gatewayCustomerId: gatewayCustomerId,
        gatewayProductId: gatewayProductId,
        gatewayOrderId: gatewayOrderId,
        tier: prismaTier,
        status: prismaStatus,
        currentPeriodStart,
        currentPeriodEnd,
        cancelledAt:
          prismaStatus === "cancelled"
            ? new Date()
            : undefined, // Don't clear cancelledAt on non-cancel updates
        // NOTE: paymentProvider is NOT updated — data isolation rule:
        // historical subscriptions permanently retain their original provider
      },
    });

    // Apply event-specific differentiated handling
    const unifiedEvent = data.rawEvent as UnifiedWebhookEvent;
    switch (unifiedEvent) {
      case "subscription_created":
        await handleSubscriptionCreated(
          user.id,
          subscription.id,
          prismaTier,
          prismaStatus,
          currentPeriodStart,
          currentPeriodEnd,
          gatewayCustomerId,
          gatewayProductId,
          gatewayOrderId,
          customerEmail
        );
        break;

      case "subscription_cancelled":
        await handleSubscriptionCancelled(subscription.id, currentPeriodEnd);
        break;

      case "subscription_expired":
        await handleSubscriptionExpired(subscription.id);
        break;

      case "subscription_payment_failed":
        await handleSubscriptionPaymentFailed(subscription.id);
        break;

      case "subscription_refunded":
        await handleSubscriptionRefunded(subscription.id);
        break;

      default:
        // subscription_updated, subscription_resumed, subscription_paused,
        // subscription_unpaused, subscription_payment_success, subscription_payment_recovered
        // Already handled by the base upsert above
        break;
    }

    // Write audit log
    const auditAction = mapToAuditAction(unifiedEvent);

    await createAuditLog({
      userId: user.id,
      action: auditAction,
      resource: "subscription",
      details: {
        gateway,
        gatewaySubscriptionId,
        tier,
        status,
        testMode,
        rawEvent,
        subscriptionId: subscription.id,
      },
    });

    console.log(
      `[WebhookHandler] Processed ${rawEvent} for user ${user.id}, ` +
      `subscription ${subscription.id}, tier=${tier}, status=${status}`
    );
  } catch (error) {
    // Isolate webhook processing errors - never crash the webhook handler
    console.error(
      `[WebhookHandler] Failed to process webhook data:`,
      error
    );
    // Re-throw so the caller can return an appropriate HTTP error
    throw error;
  }
}

/**
 * Update an existing subscription by gateway ID when no user is found.
 * This handles edge cases where the webhook arrives before user registration
 * or when the email does not match any account.
 */
async function updateExistingSubscription(
  gatewaySubscriptionId: string,
  fieldMapping: GatewayFieldMapping,
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  currentPeriodStart: Date,
  currentPeriodEnd: Date | null,
  gatewayCustomerId: string,
  gatewayProductId: string,
  gatewayOrderId: string,
  rawEvent: string
): Promise<void> {
  try {
    // Attempt to find subscription by gateway ID
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        [fieldMapping.subscriptionIdField]: gatewaySubscriptionId,
      },
    });

    if (existingSubscription) {
      // Determine event-specific updates for orphan subscriptions too
      const now = new Date();
      let updateData: Record<string, unknown> = {
        [fieldMapping.customerIdField]: gatewayCustomerId,
        [fieldMapping.productIdField]: gatewayProductId,
        [fieldMapping.orderIdField]: gatewayOrderId,
        tier,
        status,
        currentPeriodStart,
        currentPeriodEnd,
      };

      switch (rawEvent) {
        case "subscription_cancelled":
          updateData.cancelledAt = now;
          if (currentPeriodEnd && currentPeriodEnd < now) {
            updateData.tier = "free";
            updateData.status = "inactive";
          }
          break;
        case "subscription_expired":
          updateData.tier = "free";
          updateData.status = "expired";
          updateData.cancelledAt = now;
          break;
        case "subscription_payment_failed":
          updateData.status = "past_due";
          break;
        case "subscription_refunded":
          updateData.tier = "free";
          updateData.status = "cancelled";
          updateData.cancelledAt = now;
          break;
        case "subscription_created":
          updateData.cancelledAt = null;
          break;
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: updateData,
      });

      console.log(
        `[WebhookHandler] Updated orphan subscription ${existingSubscription.id} ` +
        `for event ${rawEvent}`
      );
    } else {
      console.log(
        `[WebhookHandler] No existing subscription found for gateway ID: ` +
        `${gatewaySubscriptionId}. Skipping (no user to link).`
      );
    }
  } catch (error) {
    console.error(
      `[WebhookHandler] Failed to update existing subscription:`,
      error
    );
  }
}
