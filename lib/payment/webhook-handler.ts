// FastSpring Webhook Handler
// Processes FastSpring webhook events and updates subscriptions
// Implements idempotent processing with event deduplication

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  type FastSpringWebhookPayload,
  type FastSpringEvent,
  FASTSPRING_STATUS_MAP,
  type PaymentTier,
  TIER_PRODUCT_MAP,
} from "./types";

/**
 * Verify FastSpring webhook HMAC signature
 * Uses FASTSPRING_WEBHOOK_SECRET to validate payload authenticity
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.FASTSPRING_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("[WEBHOOK] FASTSPRING_WEBHOOK_SECRET not set, skipping verification");
    return true; // Allow in development if not configured
  }

  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Process FastSpring webhook payload
 * Handles all event types idempotently
 */
export async function processWebhook(
  payload: FastSpringWebhookPayload
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  for (const event of payload.events) {
    try {
      const alreadyProcessed = await isEventProcessed(event.id);
      if (alreadyProcessed) {
        console.log(`[WEBHOOK] Event ${event.id} already processed, skipping`);
        continue;
      }

      await processEvent(event);
      await markEventProcessed(event.id);
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WEBHOOK] Failed to process event ${event.id}:`, message);
      errors.push(`${event.id}: ${message}`);
    }
  }

  return { processed, errors };
}

/**
 * Process a single FastSpring event
 */
async function processEvent(event: FastSpringEvent): Promise<void> {
  const { type, data } = event;

  switch (type) {
    case "order.completed":
      await handleOrderCompleted(data.order as Record<string, unknown> | undefined);
      break;
    case "subscription.activated":
      await handleSubscriptionActivated(data.subscription as Record<string, unknown> | undefined);
      break;
    case "subscription.updated":
      await handleSubscriptionUpdated(data.subscription as Record<string, unknown> | undefined);
      break;
    case "subscription.canceled":
      await handleSubscriptionCanceled(data.subscription as Record<string, unknown> | undefined);
      break;
    case "subscription.deactivated":
      await handleSubscriptionDeactivated(data.subscription as Record<string, unknown> | undefined);
      break;
    case "subscription.payment.overdue":
      await handleSubscriptionPastDue(data.subscription as Record<string, unknown> | undefined);
      break;
    case "return.created":
      await handleReturnCreated(data.return as Record<string, unknown> | undefined);
      break;
    default:
      console.log(`[WEBHOOK] Unhandled event type: ${type}`);
  }
}

/**
 * Handle order.completed event
 * Initial purchase - create or update subscription
 */
async function handleOrderCompleted(
  order: Record<string, unknown> | undefined
): Promise<void> {
  if (!order) return;

  const fsOrder = order as {
    id: string;
    account: string;
    items?: Array<{
      product: string;
      subscription?: string;
    }>;
  };

  // Find user by reference (userId passed during checkout)
  const userId = fsOrder.account;
  const item = fsOrder.items?.[0];
  if (!item) return;

  const productPath = item.product;
  const subscriptionId = item.subscription;
  const tier = productPathToTier(productPath);

  // Update or create subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      gateway: "fastspring",
      gatewaySubscriptionId: subscriptionId,
      gatewayCustomerId: fsOrder.account,
      gatewayProductId: productPath,
      gatewayOrderId: fsOrder.id,
      tier,
      status: "active",
    },
    update: {
      gateway: "fastspring",
      gatewaySubscriptionId: subscriptionId,
      gatewayCustomerId: fsOrder.account,
      gatewayProductId: productPath,
      gatewayOrderId: fsOrder.id,
      tier,
      status: "active",
    },
  });

  await createAuditLog({
    userId,
    action: "payment_succeeded",
    resource: "subscription",
    details: { orderId: fsOrder.id, tier, productPath },
  });
}

/**
 * Handle subscription.activated event
 */
async function handleSubscriptionActivated(
  subscription: Record<string, unknown> | undefined
): Promise<void> {
  if (!subscription) return;

  const fsSub = subscription as {
    id: string;
    account: string;
    product: string;
    status: string;
    begin?: number;
    nextChargeDate?: number;
  };

  const userId = fsSub.account;
  const tier = productPathToTier(fsSub.product);
  const status = FASTSPRING_STATUS_MAP[fsSub.status] ?? "active";

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      gateway: "fastspring",
      gatewaySubscriptionId: fsSub.id,
      gatewayCustomerId: fsSub.account,
      gatewayProductId: fsSub.product,
      tier,
      status,
      currentPeriodStart: fsSub.begin ? new Date(fsSub.begin * 1000) : null,
      currentPeriodEnd: fsSub.nextChargeDate
        ? new Date(fsSub.nextChargeDate * 1000)
        : null,
    },
    update: {
      gateway: "fastspring",
      gatewaySubscriptionId: fsSub.id,
      gatewayCustomerId: fsSub.account,
      gatewayProductId: fsSub.product,
      tier,
      status,
      currentPeriodStart: fsSub.begin ? new Date(fsSub.begin * 1000) : null,
      currentPeriodEnd: fsSub.nextChargeDate
        ? new Date(fsSub.nextChargeDate * 1000)
        : null,
    },
  });

  await createAuditLog({
    userId,
    action: "subscription_created",
    resource: "subscription",
    details: { subscriptionId: fsSub.id, tier, status },
  });
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(
  subscription: Record<string, unknown> | undefined
): Promise<void> {
  if (!subscription) return;

  const fsSub = subscription as {
    id: string;
    account: string;
    product: string;
    status: string;
    nextChargeDate?: number;
  };

  const userId = fsSub.account;
  const tier = productPathToTier(fsSub.product);
  const status = FASTSPRING_STATUS_MAP[fsSub.status] ?? "active";

  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId: fsSub.id },
    data: {
      tier,
      status,
      currentPeriodEnd: fsSub.nextChargeDate
        ? new Date(fsSub.nextChargeDate * 1000)
        : null,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId,
    action: "subscription_updated",
    resource: "subscription",
    details: { subscriptionId: fsSub.id, tier, status },
  });
}

/**
 * Handle subscription.canceled event
 */
async function handleSubscriptionCanceled(
  subscription: Record<string, unknown> | undefined
): Promise<void> {
  if (!subscription) return;

  const fsSub = subscription as {
    id: string;
    account: string;
    end?: number;
  };

  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId: fsSub.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: fsSub.account,
    action: "subscription_cancelled",
    resource: "subscription",
    details: { subscriptionId: fsSub.id },
  });
}

/**
 * Handle subscription.deactivated event
 */
async function handleSubscriptionDeactivated(
  subscription: Record<string, unknown> | undefined
): Promise<void> {
  if (!subscription) return;

  const fsSub = subscription as {
    id: string;
    account: string;
  };

  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId: fsSub.id },
    data: {
      status: "expired",
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: fsSub.account,
    action: "subscription_cancelled",
    resource: "subscription",
    details: { subscriptionId: fsSub.id, reason: "deactivated" },
  });
}

/**
 * Handle subscription.payment.overdue event
 */
async function handleSubscriptionPastDue(
  subscription: Record<string, unknown> | undefined
): Promise<void> {
  if (!subscription) return;

  const fsSub = subscription as {
    id: string;
    account: string;
  };

  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId: fsSub.id },
    data: {
      status: "past_due",
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: fsSub.account,
    action: "payment_failed",
    resource: "subscription",
    details: { subscriptionId: fsSub.id, reason: "payment_overdue" },
  });
}

/**
 * Handle return.created event (refund)
 */
async function handleReturnCreated(
  returnData: Record<string, unknown> | undefined
): Promise<void> {
  if (!returnData) return;

  const fsReturn = returnData as {
    order: string;
    account: string;
  };

  // Mark subscription as cancelled on refund
  await prisma.subscription.updateMany({
    where: { gatewayOrderId: fsReturn.order },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: fsReturn.account,
    action: "payment_failed",
    resource: "subscription",
    details: { orderId: fsReturn.order, reason: "refunded" },
  });
}

// ============================================================
// Event Deduplication
// ============================================================

/**
 * Check if a webhook event has already been processed
 * Uses Prisma to track processed event IDs
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { eventId },
    });
    return existing !== null;
  } catch {
    // If table doesn't exist, fall back to no deduplication
    return false;
  }
}

/**
 * Mark an event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  try {
    await prisma.processedWebhookEvent.create({
      data: { eventId, processedAt: new Date() },
    });
  } catch {
    // If table doesn't exist, silently skip
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Convert FastSpring product path to our tier
 */
function productPathToTier(productPath: string): PaymentTier {
  const entry = Object.entries(TIER_PRODUCT_MAP).find(
    ([, path]) => path === productPath
  );
  return (entry?.[0] as PaymentTier) ?? "starter";
}
