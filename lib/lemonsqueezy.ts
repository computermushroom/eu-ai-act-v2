// Lemon Squeezy Client Configuration
// Handles: checkout URLs, subscription management, webhook verification
// References: https://docs.lemonsqueezy.com/guides/developer-guide
//            https://docs.lemonsqueezy.com/api

import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

/**
 * Initialize Lemon Squeezy SDK
 * Must be called once before using any SDK functions
 */
export function initializeLemonSqueezy(): void {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "LEMONSQUEEZY_API_KEY is not defined in environment variables"
    );
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("Lemon Squeezy SDK error:", error);
    },
  });
}

/**
 * Product variant IDs mapped to subscription tiers
 * These must match the variant IDs configured in your Lemon Squeezy dashboard
 */
export const TIER_VARIANT_MAP: Record<string, string> = {
  starter: process.env.LEMONSQUEEZY_STARTER_VARIANT_ID ?? "",
  professional: process.env.LEMONSQUEEZY_PROFESSIONAL_VARIANT_ID ?? "",
  business: process.env.LEMONSQUEEZY_BUSINESS_VARIANT_ID ?? "",
  enterprise: process.env.LEMONSQUEEZY_ENTERPRISE_VARIANT_ID ?? "",
};

/**
 * Create a checkout URL for a subscription tier
 * @param tier - Subscription tier
 * @param userEmail - User's email for pre-filling checkout
 * @param redirectUrl - URL to redirect after checkout
 * @returns Checkout URL
 */
export async function createSubscriptionCheckout(
  tier: string,
  userEmail: string,
  redirectUrl: string
): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = TIER_VARIANT_MAP[tier];

  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not defined");
  }

  if (!variantId) {
    throw new Error(`Unknown subscription tier: ${tier}`);
  }

  // Ensure SDK is initialized
  initializeLemonSqueezy();

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
    },
    productOptions: {
      redirectUrl,
    },
  });

  if (error) {
    throw new Error(`Failed to create checkout: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutUrl = (data as any)?.attributes?.url;

  if (!checkoutUrl) {
    throw new Error("Failed to create checkout: no URL returned");
  }

  return checkoutUrl;
}

/**
 * Verify Lemon Squeezy webhook signature
 * @param payload - Raw request body
 * @param signature - X-Signature header value
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("LEMONSQUEEZY_WEBHOOK_SECRET not set, skipping verification");
    return false;
  }

  try {
    // Lemon Squeezy uses HMAC-SHA256 for webhook signatures
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Lemon Squeezy webhook event types
 */
export type LemonSqueezyWebhookEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered";

/**
 * Lemon Squeezy subscription webhook payload
 */
export interface LemonSqueezySubscriptionPayload {
  meta: {
    event_name: LemonSqueezyWebhookEvent;
  };
  data: {
    id: string;
    type: "subscriptions";
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      order_item_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      user_name: string;
      user_email: string;
      status: string;
      status_formatted: string;
      card_brand: string;
      card_last_four: string;
      pause: string | null;
      cancelled: boolean;
      trial_ends_at: string | null;
      billing_anchor: number;
      first_subscription_item: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
        is_usage_based: boolean;
      };
      urls: {
        update_payment_method: string;
      };
      renews_at: string;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
}
