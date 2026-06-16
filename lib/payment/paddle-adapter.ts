// Paddle Payment Gateway Adapter (Reserved - Not Active)
// Implements PaymentGateway interface for Paddle.com
// All methods throw errors when credentials are not configured.
// Complete Paddle API integration code is included but will not execute
// until PADDLE_VENDOR_ID and PADDLE_API_KEY are set in environment.
//
// Environment variables: PADDLE_VENDOR_ID, PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET
//                        PADDLE_STARTER_PLAN_ID, PADDLE_PROFESSIONAL_PLAN_ID,
//                        PADDLE_BUSINESS_PLAN_ID, PADDLE_ENTERPRISE_PLAN_ID

import crypto from "crypto";
import type {
  PaymentGateway,
  PaymentTier,
  BillingCycle,
  CheckoutParams,
  CheckoutResult,
  WebhookVerifyResult,
  UnifiedSubscriptionData,
  UnifiedWebhookEvent,
  UnifiedSubscriptionStatus,
} from "./types";

// ============================================================
// Paddle API Configuration
// ============================================================

/* PADDLE: 预留代码 - 后期启用 */
const PADDLE_API_BASE = "https://api.paddle.com";

/** Map subscription tiers to Paddle plan IDs from environment variables */
function getPaddlePlanId(tier: PaymentTier): string {
  const planIds: Record<PaymentTier, string> = {
    starter: process.env.PADDLE_STARTER_PLAN_ID ?? "",
    professional: process.env.PADDLE_PROFESSIONAL_PLAN_ID ?? "",
    business: process.env.PADDLE_BUSINESS_PLAN_ID ?? "",
    enterprise: process.env.PADDLE_ENTERPRISE_PLAN_ID ?? "",
  };
  return planIds[tier];
}

// ============================================================
// Paddle Webhook Event Mapping
// ============================================================

/**
 * Maps Paddle raw webhook event names to unified event types.
 * Paddle uses dot-separated event names like "subscription.created".
 */
/* PADDLE: 预留代码 - 后期启用 */
function mapPaddleEvent(rawEvent: string): UnifiedWebhookEvent | null {
  const eventMap: Record<string, UnifiedWebhookEvent> = {
    "subscription.created": "subscription_created",
    "subscription.updated": "subscription_updated",
    "subscription.cancelled": "subscription_cancelled",
    "subscription.resumed": "subscription_resumed",
    "subscription.past_due": "subscription_payment_failed",
    "subscription.paused": "subscription_paused",
    "subscription.activated": "subscription_unpaused",
    "subscription.payment_succeeded": "subscription_payment_success",
    "subscription.payment_failed": "subscription_payment_failed",
    "subscription.payment_refunded": "subscription_refunded",
    // Paddle-specific event mappings
    "transaction.completed": "subscription_payment_success",
    "transaction.payment_failed": "subscription_payment_failed",
    "transaction.refunded": "subscription_refunded",
  };
  return eventMap[rawEvent] ?? null;
}

/**
 * Maps Paddle subscription status to unified subscription status.
 */
/* PADDLE: 预留代码 - 后期启用 */
function mapPaddleStatus(rawStatus: string): UnifiedSubscriptionStatus {
  const statusMap: Record<string, UnifiedSubscriptionStatus> = {
    active: "active",
    canceled: "cancelled",
    cancelled: "cancelled",
    expired: "expired",
    inactive: "inactive",
    past_due: "past_due",
    paused: "paused",
    unpaid: "unpaid",
    trialing: "active",
    // Paddle-specific statuses
    pending: "inactive",
    deleting: "cancelled",
  };
  return statusMap[rawStatus] ?? "inactive";
}

/**
 * Maps Paddle product/plan name to PaymentTier.
 * Falls back to "starter" if no match is found.
 */
/* PADDLE: 预留代码 - 后期启用 */
function mapPaddleTier(productName: string): PaymentTier {
  const tierMap: Record<string, PaymentTier> = {
    starter: "starter",
    professional: "professional",
    pro: "professional",
    business: "business",
    enterprise: "enterprise",
  };
  const normalized = productName.toLowerCase().trim();
  for (const [key, tier] of Object.entries(tierMap)) {
    if (normalized.includes(key)) {
      return tier;
    }
  }
  return "starter";
}

// ============================================================
// Paddle Adapter Implementation
// ============================================================

export class PaddleAdapter implements PaymentGateway {
  readonly gateway = "paddle" as const;

  /**
   * Check if Paddle is properly configured.
   * Currently returns false since Paddle credentials are not set.
   */
  get isConfigured(): boolean {
    const vendorId = process.env.PADDLE_VENDOR_ID;
    const apiKey = process.env.PADDLE_API_KEY;
    return !!(
      vendorId &&
      vendorId.length > 0 &&
      apiKey &&
      apiKey.length > 0
    );
  }

  /**
   * Create a Paddle checkout session.
   * PADDLE: 预留代码 - 后期启用
   *
   * Paddle checkout flow:
   * 1. Create a price entity (or use existing plan price)
   * 2. Create a transaction with the price and customer details
   * 3. Return the checkout URL from the transaction response
   */
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const vendorId = process.env.PADDLE_VENDOR_ID;
    const apiKey = process.env.PADDLE_API_KEY;

    if (!vendorId || !apiKey) {
      throw new Error("Paddle is not configured");
    }

    /* PADDLE: 预留代码 - 后期启用 */
    const planId = getPaddlePlanId(params.tier);
    if (!planId) {
      throw new Error(`Paddle plan ID not configured for tier: ${params.tier}`);
    }

    // Step 1: Create a price for the selected plan and billing cycle
    // Paddle requires a price_id to create a transaction
    const priceData = await this.createPaddlePrice(apiKey, planId, params.billingCycle);

    // Step 2: Create a transaction (checkout session)
    const transactionData = await this.createPaddleTransaction(
      apiKey,
      priceData.id,
      params
    );

    return {
      checkoutUrl: transactionData.checkout_url,
      sessionId: transactionData.id,
    };
  }

  /**
   * Verify Paddle webhook signature and parse payload.
   * PADDLE: 预留代码 - 后期启用
   *
   * Paddle signs webhooks with HMAC-SHA256 using the webhook secret.
   * The signature is in the Paddle-Signature header with format:
   *   ts={timestamp};h1={hex_signature}
   */
  async verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookVerifyResult> {
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Paddle is not configured");
    }

    /* PADDLE: 预留代码 - 后期启用 */

    // 1. Verify HMAC-SHA256 signature
    const paddleSignature = headers.get("Paddle-Signature") ?? "";
    if (!paddleSignature) {
      throw new Error("Missing Paddle-Signature header");
    }

    // Parse Paddle signature format: ts={timestamp};h1={hex_digest}
    const parts = paddleSignature.split(";");
    let timestamp = "";
    let signature = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "ts" && value) timestamp = value;
      if (key === "h1" && value) signature = value;
    }

    if (!timestamp || !signature) {
      throw new Error("Invalid Paddle-Signature format");
    }

    // Verify timestamp is within 5 minutes to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > 300) {
      throw new Error("Paddle webhook timestamp expired (replay attack?)");
    }

    // Compute HMAC-SHA256 of timestamp + raw body
    const payloadToSign = `${timestamp}:${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadToSign)
      .digest("hex");

    // Timing-safe comparison
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );

      if (!isValid) {
        return {
          valid: false,
          event: "subscription_created",
          data: this.createEmptyData(),
        };
      }
    } catch {
      return {
        valid: false,
        event: "subscription_created",
        data: this.createEmptyData(),
      };
    }

    // 2. Parse the webhook payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new Error("[Paddle] Failed to parse webhook payload as JSON");
    }

    // 3. Extract event data from Paddle payload structure
    // Paddle sends: { event_type: "subscription.created", data: { ... } }
    const rawEvent =
      (payload.event_type as string) ?? (payload.event as string) ?? "";
    const eventData =
      (payload.data as Record<string, unknown>) ?? payload;

    const unifiedEvent = mapPaddleEvent(rawEvent);
    if (!unifiedEvent) {
      throw new Error(`[Paddle] Unrecognized webhook event: ${rawEvent}`);
    }

    // 4. Build unified subscription data
    const subscriptionData = this.parseSubscriptionData(eventData, rawEvent);

    return {
      valid: true,
      event: unifiedEvent,
      data: subscriptionData,
    };
  }

  // ============================================================
  // Paddle API Helper Methods (Reserved)
  // ============================================================

  /**
   * Create a Paddle price entity for a given plan and billing cycle.
   * PADDLE: 预留代码 - 后期启用
   *
   * POST https://api.paddle.com/prices
   */
  /* PADDLE: 预留代码 - 后期启用 */
  private async createPaddlePrice(
    apiKey: string,
    planId: string,
    billingCycle: BillingCycle
  ): Promise<{ id: string }> {
    const response = await fetch(`${PADDLE_API_BASE}/prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_id: planId,
        name: `${planId}-${billingCycle}`,
        billing_cycle: billingCycle === "monthly" ? "month" : "year",
        unit_price: {
          amount: "0", // Will be set by Paddle plan configuration
          currency_code: "USD",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Paddle API error creating price (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return { id: data?.id ?? "" };
  }

  /**
   * Create a Paddle transaction (checkout session).
   * PADDLE: 预留代码 - 后期启用
   *
   * POST https://api.paddle.com/transactions
   */
  /* PADDLE: 预留代码 - 后期启用 */
  private async createPaddleTransaction(
    apiKey: string,
    priceId: string,
    params: CheckoutParams
  ): Promise<{ id: string; checkout_url: string }> {
    const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer_email: params.userEmail,
        custom_data: {
          user_id: params.userId,
          tier: params.tier,
        },
        return_url: params.redirectUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Paddle API error creating transaction (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    const checkoutUrl =
      data?.checkout?.url ??
      data?.data?.checkout?.url ??
      "";

    const transactionId =
      data?.id ??
      data?.data?.id ??
      "";

    if (!checkoutUrl) {
      throw new Error("Paddle API did not return a checkout URL");
    }

    return { id: transactionId, checkout_url: checkoutUrl };
  }

  /**
   * Parse Paddle subscription event data into UnifiedSubscriptionData.
   * PADDLE: 预留代码 - 后期启用
   */
  /* PADDLE: 预留代码 - 后期启用 */
  private parseSubscriptionData(
    eventData: Record<string, unknown>,
    rawEvent: string
  ): UnifiedSubscriptionData {
    // Extract subscription-level data from Paddle payload
    const sub =
      (eventData.subscription as Record<string, unknown>) ??
      (eventData.attributes as Record<string, unknown>) ??
      eventData;

    const gatewaySubscriptionId =
      (sub.id as string) ?? (sub.subscription_id as string) ?? "";
    const gatewayCustomerId =
      (sub.customer_id as string) ?? (eventData.customer_id as string) ?? "";
    const gatewayProductId =
      (sub.product_id as string) ?? (sub.plan_id as string) ?? "";
    const gatewayOrderId =
      (sub.transaction_id as string) ?? (eventData.transaction_id as string) ?? "";
    const customerEmail =
      (sub.customer_email as string) ??
      (sub.email as string) ??
      (eventData.customer_email as string) ??
      "";
    const rawStatus =
      (sub.status as string) ?? (eventData.status as string) ?? "inactive";
    const productName =
      (sub.product_name as string) ??
      (sub.plan_name as string) ??
      "";
    const periodStart =
      (sub.current_billing_period_starts_at as string) ??
      (sub.billing_start as string) ?? "";
    const periodEnd =
      (sub.current_billing_period_ends_at as string) ??
      (sub.next_billing_date as string) ?? "";
    const testMode =
      (sub.test_mode as boolean) ?? (eventData.test_mode as boolean) ?? false;

    return {
      gateway: "paddle",
      gatewaySubscriptionId,
      gatewayCustomerId,
      gatewayProductId,
      gatewayOrderId,
      customerEmail,
      tier: mapPaddleTier(productName),
      status: mapPaddleStatus(rawStatus),
      currentPeriodStart: periodStart ? new Date(periodStart) : new Date(),
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      testMode,
      rawEvent,
    };
  }

  /**
   * Create an empty UnifiedSubscriptionData placeholder for invalid webhooks.
   * PADDLE: 预留代码 - 后期启用
   */
  /* PADDLE: 预留代码 - 后期启用 */
  private createEmptyData(): UnifiedSubscriptionData {
    return {
      gateway: "paddle",
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
    };
  }
}
