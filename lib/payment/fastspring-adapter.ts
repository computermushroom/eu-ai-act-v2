// FastSpring Payment Adapter
// Single gateway implementation for checkout and subscription management
// Uses FastSpring Store Builder Library + REST API

import {
  type CheckoutParams,
  type CheckoutResult,
  type SubscriptionData,
  type PaymentTier,
  TIER_PRODUCT_MAP,
  FASTSPRING_STATUS_MAP,
} from "./types";

/**
 * FastSpring API configuration
 */
function getApiConfig() {
  const apiKey = process.env.FASTSPRING_API_KEY;
  const apiPassword = process.env.FASTSPRING_API_PASSWORD;
  const storeId = process.env.FASTSPRING_STORE_ID;

  if (!apiKey || !apiPassword || !storeId) {
    throw new Error(
      "FastSpring credentials not configured. " +
        "Set FASTSPRING_API_KEY, FASTSPRING_API_PASSWORD, and FASTSPRING_STORE_ID."
    );
  }

  return {
    apiKey,
    apiPassword,
    storeId,
    baseUrl: "https://api.fastspring.com",
  };
}

/**
 * Build Basic Auth header for FastSpring API
 */
function buildAuthHeader(apiKey: string, apiPassword: string): string {
  const credentials = Buffer.from(`${apiKey}:${apiPassword}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Create a FastSpring checkout URL using Store Builder Library
 * Returns a secure checkout URL that redirects to FastSpring popup or page
 */
export async function createCheckout(
  params: CheckoutParams
): Promise<CheckoutResult> {
  const { tier, billingCycle, userEmail, userId, redirectUrl } = params;
  const config = getApiConfig();
  const productPath = TIER_PRODUCT_MAP[tier];

  // Generate a unique session ID for idempotency
  const sessionId = `fs_${Date.now()}_${userId.slice(0, 8)}`;

  // Build FastSpring checkout URL with Store Builder Library
  // The checkout URL opens FastSpring's hosted checkout
  const checkoutUrl = buildCheckoutUrl({
    storeId: config.storeId,
    productPath,
    userEmail,
    userId,
    sessionId,
    redirectUrl,
    billingCycle,
  });

  return {
    checkoutUrl,
    sessionId,
  };
}

/**
 * Build FastSpring checkout URL
 * Uses FastSpring Store Builder Library approach
 */
function buildCheckoutUrl(options: {
  storeId: string;
  productPath: string;
  userEmail: string;
  userId: string;
  sessionId: string;
  redirectUrl: string;
  billingCycle: string;
}): string {
  const {
    storeId,
    productPath,
    userEmail,
    userId,
    sessionId,
    redirectUrl,
  } = options;

  // FastSpring hosted checkout URL
  // Format: https://store.fastspring.com/<storeId>/product/<productPath>
  const baseUrl = `https://store.fastspring.com/${storeId}/product/${productPath}`;

  const queryParams = new URLSearchParams({
    email: userEmail,
    // Pass our internal user ID as a custom reference for webhook correlation
    reference: userId,
    // Session ID for idempotency tracking
    tags: sessionId,
    // Success redirect back to our app
    success: redirectUrl,
    // Cancel redirect back to pricing page
    cancel: `${redirectUrl}/pricing`,
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Get subscription details from FastSpring via REST API
 */
export async function getSubscription(
  subscriptionId: string
): Promise<SubscriptionData | null> {
  const config = getApiConfig();

  try {
    const response = await fetch(
      `${config.baseUrl}/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: buildAuthHeader(config.apiKey, config.apiPassword),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `FastSpring API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return normalizeSubscription(data);
  } catch (error) {
    console.error("[FastSpring] Get subscription failed:", error);
    throw error;
  }
}

/**
 * Cancel a subscription in FastSpring
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const config = getApiConfig();

  const response = await fetch(
    `${config.baseUrl}/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: buildAuthHeader(config.apiKey, config.apiPassword),
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `FastSpring cancel failed: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Normalize FastSpring subscription to our SubscriptionData format
 */
function normalizeSubscription(data: Record<string, unknown>): SubscriptionData {
  const fsSub = data as {
    id: string;
    subscription?: string;
    account?: string;
    product?: string;
    status?: string;
    begin?: number;
    nextChargeDate?: number;
    end?: number;
  };

  const tier = productPathToTier(fsSub.product ?? "");
  const status = FASTSPRING_STATUS_MAP[fsSub.status ?? ""] ?? "inactive";

  return {
    subscriptionId: fsSub.id,
    customerId: fsSub.account ?? "",
    productId: fsSub.product ?? "",
    status,
    tier,
    currentPeriodStart: fsSub.begin ? new Date(fsSub.begin * 1000) : undefined,
    currentPeriodEnd: fsSub.nextChargeDate
      ? new Date(fsSub.nextChargeDate * 1000)
      : undefined,
  };
}

/**
 * Convert FastSpring product path to our tier
 */
function productPathToTier(productPath: string): PaymentTier {
  const entry = Object.entries(TIER_PRODUCT_MAP).find(
    ([, path]) => path === productPath
  );
  return (entry?.[0] as PaymentTier) ?? "starter";
}

/**
 * Map our tier to FastSpring product path
 */
export function tierToProductPath(tier: PaymentTier): string {
  return TIER_PRODUCT_MAP[tier];
}
