// Paddle Payment Gateway Adapter (Reserved - Not Active)
// Implements PaymentGateway interface for Paddle Billing (new version)
// All methods throw errors when credentials are not configured.
// Complete Paddle API integration code is included but will not execute
// until PADDLE_API_KEY (or PADDLE_API_KEY_SANDBOX) is set in environment.
//
// Environment variables: PADDLE_API_KEY, PADDLE_API_KEY_SANDBOX, PADDLE_WEBHOOK_SECRET
//                        PADDLE_STARTER_PRICE_ID, PADDLE_PROFESSIONAL_PRICE_ID,
//                        PADDLE_BUSINESS_PRICE_ID, PADDLE_ENTERPRISE_PRICE_ID

import crypto from "crypto";
import type {
  PaymentGateway,
  PaymentTier,
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

/** Map subscription tiers to Paddle price IDs from environment variables */
function getPaddlePriceId(tier: PaymentTier): string {
  const priceIds: Record<PaymentTier, string> = {
    starter: process.env.PADDLE_STARTER_PRICE_ID ?? "",
    professional: process.env.PADDLE_PROFESSIONAL_PRICE_ID ?? "",
    business: process.env.PADDLE_BUSINESS_PRICE_ID ?? "",
    enterprise: process.env.PADDLE_ENTERPRISE_PRICE_ID ?? "",
  };
  return priceIds[tier];
}

/** Get the active API key (production or sandbox) */
function getPaddleApiKey(): string | undefined {
  return process.env.PADDLE_API_KEY || process.env.PADDLE_API_KEY_SANDBOX;
}

// ============================================================
// Paddle Webhook Event Mapping
// ============================================================

/**
 * Maps Paddle raw webhook event names to unified event types.
 * Paddle Billing uses dot-separated event names like "subscription.created".
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
   * Paddle Billing requires only an API key (Bearer token).
   */
  get isConfigured(): boolean {
    const apiKey = getPaddleApiKey();
    return !!(apiKey && apiKey.length > 0);
  }

  /**
   * Create a Paddle Billing checkout session.
   * PADDLE: 预留代码 - 后期启用
   *
   * Paddle Billing checkout flow:
   * 1. Create a customer (POST /customers) to get customer_id
   * 2. Create a transaction (POST /transactions) with items and customer_id
   * 3. Return the checkout URL from the transaction response
   */
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = getPaddleApiKey();

    if (!apiKey) {
      throw new Error("Paddle is not configured: missing PADDLE_API_KEY or PADDLE_API_KEY_SANDBOX");
    }

    /* PADDLE: 预留代码 - 后期启用 */
    const priceId = getPaddlePriceId(params.tier);
    if (!priceId) {
      throw new Error(`Paddle price ID not configured for tier: ${params.tier}`);
    }

    // Step 1: Create a customer to get customer_id
    const customerData = await this.createPaddleCustomer(apiKey, params);

    // Step 2: Create a transaction (checkout session)
    const transactionData = await this.createPaddleTransaction(
      apiKey,
      priceId,
      customerData.id,
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
      throw new Error("Paddle is not configured: missing PADDLE_WEBHOOK_SECRET");
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
   * Create a Paddle customer.
   * PADDLE: 预留代码 - 后期启用
   *
   * POST https://api.paddle.com/customers
   */
  /* PADDLE: 预留代码 - 后期启用 */
  private async createPaddleCustomer(
    apiKey: string,
    params: CheckoutParams
  ): Promise<{ id: string }> {
    const response = await fetch(`${PADDLE_API_BASE}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: params.userEmail,
        custom_data: {
          user_id: params.userId,
          tier: params.tier,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Paddle API error creating customer (${response.status}): ${errorText}`);
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
    customerId: string,
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
        customer_id: customerId,
        collection_mode: params.billingCycle === "yearly" ? "automatic" : "automatic",
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
