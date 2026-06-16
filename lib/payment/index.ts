// Payment Gateway Manager
// Routes to the active gateway based on PAYMENT_GATEWAY env var
// Singleton pattern - getPaymentGateway() returns the active adapter

import type { PaymentGateway, PaymentGatewayType } from "./types";
import { CreemAdapter } from "./creem-adapter";
import { PaddleAdapter } from "./paddle-adapter";

/** Get the active payment gateway based on PAYMENT_GATEWAY env var */
export function getPaymentGateway(): PaymentGateway {
  const gateway = (process.env.PAYMENT_GATEWAY ?? "creem") as PaymentGatewayType;

  switch (gateway) {
    case "creem":
      return new CreemAdapter();
    case "paddle":
      return new PaddleAdapter();
    default:
      console.warn(`Unknown PAYMENT_GATEWAY: ${gateway}, falling back to creem`);
      return new CreemAdapter();
  }
}

/** Get the active gateway type */
export function getActiveGatewayType(): PaymentGatewayType {
  return (process.env.PAYMENT_GATEWAY ?? "creem") as PaymentGatewayType;
}
