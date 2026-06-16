// Payment Gateway Types
// Unified type definitions for Creem + Paddle dual-gateway architecture
// All gateways implement the same PaymentGateway interface

/** Supported payment gateway identifiers */
export type PaymentGatewayType = "creem" | "paddle";

/** Subscription tier identifiers */
export type PaymentTier = "starter" | "professional" | "business" | "enterprise";

/** Billing cycle */
export type BillingCycle = "monthly" | "yearly";

/** Standardized subscription status across all gateways */
export type UnifiedSubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "inactive"
  | "past_due"
  | "paused"
  | "unpaid";

/** Standardized webhook event types */
export type UnifiedWebhookEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered"
  | "subscription_refunded";

/** Checkout session creation parameters */
export interface CheckoutParams {
  tier: PaymentTier;
  billingCycle: BillingCycle;
  userEmail: string;
  userId: string;
  redirectUrl: string;
}

/** Checkout session result */
export interface CheckoutResult {
  /** URL to redirect user to for payment */
  checkoutUrl: string;
  /** Gateway-specific session/checkout ID for tracking */
  sessionId: string;
}

/** Standardized subscription data from webhook */
export interface UnifiedSubscriptionData {
  /** Gateway identifier (creem/paddle) */
  gateway: PaymentGatewayType;
  /** Gateway-specific subscription ID */
  gatewaySubscriptionId: string;
  /** Gateway-specific customer ID */
  gatewayCustomerId: string;
  /** Gateway-specific product/plan ID */
  gatewayProductId: string;
  /** Gateway-specific order/transaction ID */
  gatewayOrderId: string;
  /** Customer email */
  customerEmail: string;
  /** Mapped subscription tier */
  tier: PaymentTier;
  /** Mapped subscription status */
  status: UnifiedSubscriptionStatus;
  /** Current billing period start */
  currentPeriodStart: Date;
  /** Current billing period end */
  currentPeriodEnd: Date | null;
  /** Whether this is a test/sandbox transaction */
  testMode: boolean;
  /** Original raw webhook event name from gateway */
  rawEvent: string;
}

/** Webhook verification result */
export interface WebhookVerifyResult {
  valid: boolean;
  event: UnifiedWebhookEvent;
  data: UnifiedSubscriptionData;
}

/** Payment gateway adapter interface */
export interface PaymentGateway {
  /** Gateway identifier */
  readonly gateway: PaymentGatewayType;

  /** Whether this gateway is configured and ready to use */
  readonly isConfigured: boolean;

  /** Create a checkout session */
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;

  /** Verify webhook signature and parse payload */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookVerifyResult>;
}
