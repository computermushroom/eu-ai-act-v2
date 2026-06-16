// Unified Webhook Handler
// Processes standardized webhook data from any payment gateway
// Writes subscription updates to the database via Prisma
// Idempotent: uses gateway + gatewaySubscriptionId for deduplication
// Writes audit logs for all subscription state changes

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
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
// Webhook Processing
// ============================================================

/**
 * Process unified webhook data and write to database.
 * This is the main entry point after webhook verification.
 *
 * Handles all event types:
 * - created: Creates or updates subscription record
 * - updated: Updates subscription status/tier
 * - cancelled: Marks subscription as cancelled
 * - expired: Marks subscription as expired
 * - paused: Marks subscription as paused
 * - payment_failed: Marks subscription as past_due
 * - refunded: Cancels subscription
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
      },
    });

    // Write audit log
    const auditAction = mapToAuditAction(data.rawEvent as UnifiedWebhookEvent);

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
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          [fieldMapping.customerIdField]: gatewayCustomerId,
          [fieldMapping.productIdField]: gatewayProductId,
          [fieldMapping.orderIdField]: gatewayOrderId,
          tier,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelledAt: status === "cancelled" ? new Date() : undefined,
        },
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
