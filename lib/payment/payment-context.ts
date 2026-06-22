// Payment Context - Global Payment Dispatcher
// Single entry point for all payment operations
// Reads active gateway from GlobalConfig table (runtime, no restart needed)
// Falls back to Paddle if DB is unreachable or config is missing
//
// UPPER LAYER (pages, API routes) MUST call methods from this file only.
// NEVER import PaddleStrategy or CreemStrategy directly in business code.

import { prisma } from "@/lib/prisma";
import { PaddleStrategy } from "./strategy/paddle-strategy";
import { CreemStrategy } from "./strategy/creem-strategy";
import type {
  BasePaymentStrategy,
  PaymentGatewayType,
  PaymentProviderInfo,
  CheckoutParams,
  CheckoutResult,
  WebhookVerifyResult,
} from "./types";

// ============================================================
// Strategy Instances (Singleton)
// ============================================================

const paddleStrategy = new PaddleStrategy();
const creemStrategy = new CreemStrategy();

/** Strategy registry for direct access by gateway type (used by webhooks) */
const STRATEGY_MAP: Record<PaymentGatewayType, BasePaymentStrategy> = {
  paddle: paddleStrategy,
  creem: creemStrategy,
};

// ============================================================
// Global Config DB Access
// ============================================================

/** Config key for active payment provider in GlobalConfig table */
const CONFIG_KEY_ACTIVE_PROVIDER = "active_payment_provider";

/** Default gateway if DB config is missing or corrupted */
const DEFAULT_GATEWAY: PaymentGatewayType = "paddle";

/** Valid gateway values */
const VALID_GATEWAYS: PaymentGatewayType[] = ["paddle", "creem"];

/**
 * Read the active payment provider from GlobalConfig table.
 * Falls back to DEFAULT_GATEWAY ("paddle") if:
 * - DB is unreachable
 * - Config row does not exist
 * - Config value is invalid
 *
 * @returns The active payment gateway type
 */
export async function getActiveProvider(): Promise<PaymentGatewayType> {
  try {
    const config = await prisma.globalConfig.findUnique({
      where: { configKey: CONFIG_KEY_ACTIVE_PROVIDER },
    });

    if (!config) {
      console.warn(
        "[PaymentContext] GlobalConfig not found, using default:",
        DEFAULT_GATEWAY
      );
      return DEFAULT_GATEWAY;
    }

    const value = config.configValue.trim().toLowerCase();
    if (VALID_GATEWAYS.includes(value as PaymentGatewayType)) {
      return value as PaymentGatewayType;
    }

    console.warn(
      `[PaymentContext] Invalid gateway value "${value}", using default:`,
      DEFAULT_GATEWAY
    );
    return DEFAULT_GATEWAY;
  } catch (error) {
    console.error("[PaymentContext] Failed to read GlobalConfig:", error);
    return DEFAULT_GATEWAY;
  }
}

/**
 * Update the active payment provider in GlobalConfig table.
 * Only callable by admin-authorized API routes.
 *
 * @param gateway - The new active gateway ("paddle" or "creem")
 */
export async function setActiveProvider(
  gateway: PaymentGatewayType
): Promise<void> {
  if (!VALID_GATEWAYS.includes(gateway)) {
    throw new Error(`Invalid payment gateway: ${gateway}. Must be "paddle" or "creem".`);
  }

  await prisma.globalConfig.upsert({
    where: { configKey: CONFIG_KEY_ACTIVE_PROVIDER },
    create: {
      configKey: CONFIG_KEY_ACTIVE_PROVIDER,
      configValue: gateway,
    },
    update: {
      configValue: gateway,
    },
  });

  console.log(`[PaymentContext] Active provider updated to: ${gateway}`);
}

// ============================================================
// Payment Operations (Business Code Entry Points)
// ============================================================

/**
 * Get the active payment strategy instance.
 * Reads from GlobalConfig table for runtime switching.
 *
 * @returns The active BasePaymentStrategy implementation
 */
export async function getPaymentStrategy(): Promise<BasePaymentStrategy> {
  const activeProvider = await getActiveProvider();
  const strategy = STRATEGY_MAP[activeProvider];

  console.log(
    `[PaymentContext] Using gateway: ${activeProvider}, configured: ${strategy.isConfigured}`
  );

  return strategy;
}

/**
 * Get a specific strategy by gateway type.
 * Used by webhook handlers which always know which gateway they serve.
 *
 * @param gateway - The gateway type
 * @returns The corresponding strategy instance
 */
export function getStrategyByType(
  gateway: PaymentGatewayType
): BasePaymentStrategy {
  return STRATEGY_MAP[gateway];
}

/**
 * Create a checkout session using the active payment gateway.
 * This is the ONLY method upper-layer code should call for checkout.
 *
 * @param params - Checkout parameters
 * @returns Checkout result with redirect URL
 */
export async function createCheckout(
  params: CheckoutParams
): Promise<CheckoutResult> {
  const strategy = await getPaymentStrategy();

  if (!strategy.isConfigured) {
    throw new Error(
      `Payment gateway "${strategy.gateway}" is not configured. ` +
      `Missing required API keys.`
    );
  }

  const result = await strategy.createCheckout(params);

  console.log(
    `[PaymentContext] Checkout created via ${strategy.gateway}, ` +
    `sessionId: ${result.sessionId}, tier: ${params.tier}`
  );

  return result;
}

/**
 * Get payment provider info for frontend (SDK loading, etc.)
 *
 * @returns Provider info with active gateway and configuration status
 */
export async function getPaymentProviderInfo(): Promise<PaymentProviderInfo> {
  const strategy = await getPaymentStrategy();
  return {
    activeGateway: strategy.gateway,
    isConfigured: strategy.isConfigured,
  };
}

/**
 * Verify a webhook payload using the specified gateway strategy.
 * Webhook handlers call this with their known gateway type.
 *
 * @param rawBody - Raw request body string
 * @param headers - Request headers
 * @param gateway - Which gateway's verification to use
 * @returns Webhook verification result
 */
export async function verifyWebhook(
  rawBody: string,
  headers: Headers,
  gateway: PaymentGatewayType
): Promise<WebhookVerifyResult> {
  const strategy = getStrategyByType(gateway);
  return strategy.verifyWebhook(rawBody, headers);
}
