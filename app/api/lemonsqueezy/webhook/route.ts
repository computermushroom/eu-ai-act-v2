// Lemon Squeezy Webhook Handler
// Processes subscription events and syncs to database
// Security: HMAC-SHA256 signature verification
// Events handled: subscription_created, subscription_updated, subscription_cancelled, subscription_expired

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  verifyWebhookSignature,
  type LemonSqueezySubscriptionPayload,
  type LemonSqueezyWebhookEvent,
} from "@/lib/lemonsqueezy";
import type { SubscriptionStatus, SubscriptionTier } from "@prisma/client";

/**
 * Map Lemon Squeezy variant ID to our subscription tier
 * These must match the variant IDs in your Lemon Squeezy dashboard
 * Configure via environment variables or update with actual variant IDs
 */
function getVariantToTierMap(): Record<number, SubscriptionTier> {
  const map: Record<number, SubscriptionTier> = {};

  const starterId = process.env.LEMONSQUEEZY_STARTER_VARIANT_ID;
  const professionalId = process.env.LEMONSQUEEZY_PROFESSIONAL_VARIANT_ID;
  const businessId = process.env.LEMONSQUEEZY_BUSINESS_VARIANT_ID;
  const enterpriseId = process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID;

  if (starterId) {
    map[parseInt(starterId, 10)] = "starter";
  }
  if (professionalId) {
    map[parseInt(professionalId, 10)] = "professional";
  }
  if (businessId) {
    map[parseInt(businessId, 10)] = "business";
  }
  if (enterpriseId) {
    map[parseInt(enterpriseId, 10)] = "enterprise";
  }

  return map;
}

/**
 * Map Lemon Squeezy status to our SubscriptionStatus
 */
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  cancelled: "cancelled",
  expired: "expired",
  inactive: "inactive",
  past_due: "past_due",
  paused: "paused",
  unpaid: "unpaid",
};

/**
 * POST handler for Lemon Squeezy webhooks
 * Verifies signature, parses event, updates database
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("X-Signature");
    if (!signature) {
      console.error("Webhook: Missing X-Signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Webhook: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse payload
    let payload: LemonSqueezySubscriptionPayload;
    try {
      payload = JSON.parse(rawBody) as LemonSqueezySubscriptionPayload;
    } catch {
      console.error("Webhook: Invalid JSON payload");
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const eventName = payload.meta.event_name;
    const subscriptionData = payload.data;
    const attrs = subscriptionData.attributes;

    console.log(`Webhook received: ${eventName} for subscription ${subscriptionData.id}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: attrs.user_email },
    });

    if (!user) {
      console.error(`Webhook: User not found for email ${attrs.user_email}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle event
    await handleWebhookEvent(eventName, subscriptionData, user.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Process individual webhook event
 */
async function handleWebhookEvent(
  eventName: LemonSqueezyWebhookEvent,
  data: LemonSqueezySubscriptionPayload["data"],
  userId: string
): Promise<void> {
  const attrs = data.attributes;
  const lemonSqueezyId = data.id;

  // Determine tier from variant ID
  const variantMap = getVariantToTierMap();
  const tier = variantMap[attrs.variant_id] ?? "free";
  const status = STATUS_MAP[attrs.status] ?? "inactive";

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused":
    case "subscription_payment_success":
    case "subscription_payment_recovered": {
      // Upsert subscription record
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          lemonSqueezyId,
          lemonSqueezyCustomerId: String(attrs.customer_id),
          lemonSqueezyVariantId: String(attrs.variant_id),
          lemonSqueezyProductId: String(attrs.product_id),
          lemonSqueezyOrderId: String(attrs.order_id),
          status,
          tier,
          currentPeriodStart: new Date(attrs.created_at),
          currentPeriodEnd: attrs.renews_at
            ? new Date(attrs.renews_at)
            : null,
        },
        update: {
          lemonSqueezyId,
          lemonSqueezyCustomerId: String(attrs.customer_id),
          lemonSqueezyVariantId: String(attrs.variant_id),
          lemonSqueezyProductId: String(attrs.product_id),
          lemonSqueezyOrderId: String(attrs.order_id),
          status,
          tier,
          currentPeriodEnd: attrs.renews_at
            ? new Date(attrs.renews_at)
            : null,
          cancelledAt: attrs.cancelled
            ? new Date()
            : null,
        },
      });

      // Audit log
      const isPayment = eventName === "subscription_payment_success" || eventName === "subscription_payment_recovered";
      await createAuditLog({
        userId,
        action: isPayment ? "payment_succeeded" : "subscription_updated",
        resource: "subscription",
        details: { tier, status, event: eventName, lemonSqueezyId },
      });
      break;
    }

    case "subscription_cancelled": {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });
      await createAuditLog({
        userId,
        action: "subscription_cancelled",
        resource: "subscription",
        details: { lemonSqueezyId },
      });
      break;
    }

    case "subscription_expired": {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "expired",
          tier: "free",
        },
      });
      await createAuditLog({
        userId,
        action: "subscription_updated",
        resource: "subscription",
        details: { status: "expired", tier: "free", lemonSqueezyId },
      });
      break;
    }

    case "subscription_paused": {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "paused",
        },
      });
      await createAuditLog({
        userId,
        action: "subscription_updated",
        resource: "subscription",
        details: { status: "paused", lemonSqueezyId },
      });
      break;
    }

    case "subscription_payment_failed": {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: "past_due",
        },
      });
      await createAuditLog({
        userId,
        action: "payment_failed",
        resource: "subscription",
        details: { status: "past_due", lemonSqueezyId },
      });
      break;
    }

    default: {
      console.warn(`Webhook: Unhandled event type: ${eventName}`);
    }
  }
}
