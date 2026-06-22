// Payment Module - Public API
// All payment operations are routed through PaymentContext
// which reads the active gateway from GlobalConfig (runtime, no restart)
//
// UPPER LAYER CODE: import from "@/lib/payment" and use:
//   - createCheckout(params)     — create a checkout session
//   - getPaymentProviderInfo()   — get active gateway info for frontend
//   - getActiveProvider()        — read current active gateway
//   - setActiveProvider(gateway)  — update active gateway (admin only)
//   - getStrategyByType(type)    — get specific strategy (webhook use)
//   - verifyWebhook(body, hdrs, type) — verify webhook (webhook use)

// Re-export everything from payment-context (primary entry point)
export {
  createCheckout,
  getPaymentProviderInfo,
  getActiveProvider,
  setActiveProvider,
  getStrategyByType,
  verifyWebhook,
} from "./payment-context";

// Re-export types for external consumers
export type {
  PaymentGatewayType,
  PaymentTier,
  BillingCycle,
  UnifiedSubscriptionStatus,
  UnifiedWebhookEvent,
  CheckoutParams,
  CheckoutResult,
  UnifiedSubscriptionData,
  WebhookVerifyResult,
  PaymentProviderInfo,
  BasePaymentStrategy,
} from "./types";

// Re-export plan mapping utilities
export { PLAN_MAP, getPlanId, getPlanMapping } from "./plan-map";

// Re-export webhook handler (used by webhook routes)
export { processWebhookData } from "./webhook-handler";
