// Creem Payment Strategy
// Implements BasePaymentStrategy for Creem.io (backup gateway)
// All API calls use native fetch - no external SDK dependency
// Environment variables: CREEM_API_KEY, CREEM_WEBHOOK_SECRET,
//                        CREEM_STARTER_PRODUCT_ID, CREEM_PROFESSIONAL_PRODUCT_ID,
//                        CREEM_BUSINESS_PRODUCT_ID, CREEM_ENTERPRISE_PRODUCT_ID

import crypto from "crypto";
import type {
  BasePaymentStrategy,
  PaymentTier,
  CheckoutParams,
  CheckoutResult,
  WebhookVerifyResult,
  UnifiedSubscriptionData,
  UnifiedWebhookEvent,
  UnifiedSubscriptionStatus,
} from "../types";
import { getPlanId } from "../plan-map";

// ============================================================
// Creem API Configuration
// ============================================================

const CREEM_API_BASE = "https://api.creem.io/v1";

// ============================================================
// Creem Webhook Event Mapping
// ============================================================

/**
 * Maps Creem raw webhook event names to unified event types.
 * Creem uses snake_case event names like "subscription.created".
 */
function mapCreemEvent(rawEvent: string): UnifiedWebhookEvent | null {
  const eventMap: Record<string, UnifiedWebhookEvent> = {
    "subscription.created": "subscription_created",
    "subscription.updated": "subscription_updated",
    "subscription.cancelled": "subscription_cancelled",
    "subscription.resumed": "subscription_resumed",
    "subscription.expired": "subscription_expired",
    "subscription.paused": "subscription_paused",
    "subscription.unpaused": "subscription_unpaused",
    "subscription.payment_success": "subscription_payment_success",
    "subscription.payment_failed": "subscription_payment_failed",
    "subscription.payment_recovered": "subscription_payment_recovered",
    "subscription.refunded": "subscription_refunded",
    // Alias mappings for common Creem event formats
    "order.completed": "subscription_payment_success",
    "order.refunded": "subscription_refunded",
    "payment.success": "subscription_payment_success",
    "payment.failed": "subscription_payment_failed",
  };
  return eventMap[rawEvent] ?? null;
}

/**
 * Maps Creem subscription status to unified subscription status.
 */
function mapCreemStatus(rawStatus: string): UnifiedSubscriptionStatus {
  const statusMap: Record<string, UnifiedSubscriptionStatus> = {
    active: "active",
    cancelled: "cancelled",
    expired: "expired",
    inactive: "inactive",
    past_due: "past_due",
    paused: "paused",
    unpaid: "unpaid",
    trialing: "active",
    pending: "inactive",
    failed: "past_due",
  };
  return statusMap[rawStatus] ?? "inactive";
}

/**
 * Maps Creem product/plan name to PaymentTier.
 * Falls back to "starter" if no match is found.
 */
function mapCreemTier(productName: string): PaymentTier {
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
// Creem Strategy Implementation
// ============================================================

export class CreemStrategy implements BasePaymentStrategy {
  readonly gateway = "creem" as const;

  /** Check if Creem is properly configured with required credentials */
  get isConfigured(): boolean {
    const apiKey = process.env.CREEM_API_KEY;
    return !!(apiKey && apiKey.length > 0);
  }

  /**
   * Create a Creem checkout session.
   * POST https://api.creem.io/v1/checkouts
   */
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = process.env.CREEM_API_KEY;

    if (!apiKey) {
      throw new Error("Creem is not configured: missing CREEM_API_KEY");
    }

    const productId = getPlanId(params.tier, "creem");
    if (!productId) {
      throw new Error(`Creem product ID not configured for tier: ${params.tier}`);
    }

    const requestBody: Record<string, unknown> = {
      product_id: productId,
      customer: {
        email: params.userEmail,
        id: params.userId,
      },
      success_url: params.redirectUrl,
      metadata: {
        user_id: params.userId,
        tier: params.tier,
      },
    };

    try {
      const response = await fetch(`${CREEM_API_BASE}/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Creem API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      // Creem returns checkout URL and session ID in the response
      const checkoutUrl = data?.url ?? data?.checkout_url ?? "";
      const sessionId = data?.id ?? data?.session_id ?? "";

      if (!checkoutUrl) {
        throw new Error("Creem API did not return a checkout URL");
      }

      return { checkoutUrl, sessionId };
    } catch (error) {
      // Isolate Creem errors - re-throw with context
      if (error instanceof Error) {
        throw new Error(`[Creem] createCheckout failed: ${error.message}`);
      }
      throw new Error("[Creem] createCheckout failed with unknown error");
    }
  }

  /**
   * Verify Creem webhook signature and parse payload.
   * Uses HMAC-SHA256 with CREEM_WEBHOOK_SECRET.
   * Signature is passed in the creem-signature header (lowercase).
   */
  async verifyWebhook(
    rawBody: string,
    headers: Headers
  ): Promise<WebhookVerifyResult> {
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("CREEM_WEBHOOK_SECRET is not configured");
    }

    // 1. Verify HMAC-SHA256 signature
    const signature = headers.get("creem-signature") ?? "";
    if (!signature) {
      throw new Error("Missing creem-signature header");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
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
      // Signature length mismatch - invalid
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
      throw new Error("[Creem] Failed to parse webhook payload as JSON");
    }

    // 3. Extract event data from Creem payload structure
    // Creem typically sends: { event: "subscription.created", data: { ... } }
    const rawEvent = (payload.event as string) ?? (payload.type as string) ?? "";
    const eventData = (payload.data as Record<string, unknown>) ?? payload;

    const unifiedEvent = mapCreemEvent(rawEvent);
    if (!unifiedEvent) {
      throw new Error(`[Creem] Unrecognized webhook event: ${rawEvent}`);
    }

    // 4. Build unified subscription data
    const subscriptionData = this.parseSubscriptionData(eventData, rawEvent);

    return {
      valid: true,
      event: unifiedEvent,
      data: subscriptionData,
    };
  }

  /**
   * Parse Creem subscription event data into UnifiedSubscriptionData.
   */
  private parseSubscriptionData(
    eventData: Record<string, unknown>,
    rawEvent: string
  ): UnifiedSubscriptionData {
    // Extract subscription-level data (Creem nests under subscription or attributes)
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
      (sub.order_id as string) ?? (eventData.order_id as string) ?? "";
    const customerEmail =
      (sub.customer_email as string) ??
      (sub.user_email as string) ??
      (eventData.customer_email as string) ??
      "";
    const rawStatus =
      (sub.status as string) ?? (eventData.status as string) ?? "inactive";
    const productName =
      (sub.product_name as string) ??
      (sub.plan_name as string) ??
      (sub.variant_name as string) ??
      "";
    const periodStart = (sub.current_period_start as string) ?? (sub.billing_anchor as string) ?? "";
    const periodEnd = (sub.current_period_end as string) ?? (sub.renews_at as string) ?? "";
    const testMode = (sub.test_mode as boolean) ?? (eventData.test_mode as boolean) ?? false;

    return {
      gateway: "creem",
      gatewaySubscriptionId,
      gatewayCustomerId,
      gatewayProductId,
      gatewayOrderId,
      customerEmail,
      tier: mapCreemTier(productName),
      status: mapCreemStatus(rawStatus),
      currentPeriodStart: periodStart ? new Date(periodStart) : new Date(),
      currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
      testMode,
      rawEvent,
    };
  }

  /**
   * Create an empty UnifiedSubscriptionData placeholder for invalid webhooks.
   */
  private createEmptyData(): UnifiedSubscriptionData {
    return {
      gateway: "creem",
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
