// Payment Module - FastSpring Single Gateway
// Export entry for all payment-related functionality

export {
  createCheckout,
  getSubscription,
  cancelSubscription,
  tierToProductPath,
} from "./fastspring-adapter";

export {
  verifyWebhookSignature,
  processWebhook,
} from "./webhook-handler";

export type {
  PaymentTier,
  BillingCycle,
  CheckoutParams,
  CheckoutResult,
  SubscriptionData,
  SubscriptionStatus,
  FastSpringEventType,
  FastSpringWebhookPayload,
  FastSpringEvent,
  FastSpringEventData,
  FastSpringOrder,
  FastSpringOrderItem,
  FastSpringSubscription,
  FastSpringReturn,
} from "./types";

export { TIER_PRODUCT_MAP, FASTSPRING_STATUS_MAP } from "./types";
