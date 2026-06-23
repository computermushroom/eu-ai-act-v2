// Payment Types - FastSpring Single Gateway
// Defines all type contracts for the payment system

/**
 * Subscription tier names
 * Aligned with pricing page and database enum
 */
export type PaymentTier = "starter" | "professional" | "business" | "enterprise";

/**
 * Billing cycle options
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * Checkout session parameters
 */
export interface CheckoutParams {
  tier: PaymentTier;
  billingCycle: BillingCycle;
  userEmail: string;
  userId: string;
  redirectUrl: string;
}

/**
 * Checkout session result
 */
export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Subscription data from payment gateway
 */
export interface SubscriptionData {
  subscriptionId: string;
  customerId: string;
  productId: string;
  orderId?: string;
  status: SubscriptionStatus;
  tier: PaymentTier;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

/**
 * Subscription status (matches Prisma enum)
 */
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "inactive"
  | "past_due"
  | "paused"
  | "unpaid";

/**
 * FastSpring webhook event types
 * Reference: https://developer.fastspring.com/reference/webhooks
 */
export type FastSpringEventType =
  | "order.completed"
  | "subscription.activated"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.deactivated"
  | "subscription.payment.overdue"
  | "return.created";

/**
 * FastSpring webhook payload
 */
export interface FastSpringWebhookPayload {
  events: FastSpringEvent[];
}

/**
 * Individual FastSpring event
 */
export interface FastSpringEvent {
  id: string;
  type: FastSpringEventType;
  created: number; // Unix timestamp
  data: FastSpringEventData;
}

/**
 * FastSpring event data (order or subscription)
 */
export interface FastSpringEventData {
  order?: FastSpringOrder;
  subscription?: FastSpringSubscription;
  return?: FastSpringReturn;
}

/**
 * FastSpring order object
 */
export interface FastSpringOrder {
  id: string;
  reference: string;
  account: string; // Customer ID
  total: number;
  currency: string;
  items: FastSpringOrderItem[];
}

/**
 * FastSpring order item
 */
export interface FastSpringOrderItem {
  product: string; // Product path/ID
  quantity: number;
  price: number;
  subscription?: string; // Subscription ID if recurring
}

/**
 * FastSpring subscription object
 */
export interface FastSpringSubscription {
  id: string;
  subscription: string; // Subscription display ID
  account: string; // Customer ID
  product: string; // Product path
  quantity: number;
  status: string; // active, canceled, deactivated, etc.
  begin: number; // Unix timestamp
  nextChargeDate: number; // Unix timestamp
  end?: number; // Unix timestamp (for cancelled)
}

/**
 * FastSpring return/refund object
 */
export interface FastSpringReturn {
  id: string;
  order: string;
  account: string;
  total: number;
  currency: string;
}

/**
 * Tier to FastSpring product path mapping
 * Configure these in your FastSpring dashboard
 */
export const TIER_PRODUCT_MAP: Record<PaymentTier, string> = {
  starter: "starter-plan",
  professional: "professional-plan",
  business: "business-plan",
  enterprise: "enterprise-plan",
};

/**
 * FastSpring subscription status to our status mapping
 */
export const FASTSPRING_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  canceled: "cancelled",
  cancelled: "cancelled",
  deactivated: "expired",
  past_due: "past_due",
  paused: "paused",
  unpaid: "unpaid",
};
