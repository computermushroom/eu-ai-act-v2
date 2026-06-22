-- Migration: Add GlobalConfig table and Subscription.paymentProvider field
-- Date: 2026-06-23
-- Purpose: Enable runtime payment gateway switching (Paddle primary, Creem fallback)
--          without server restart. Track payment provider per subscription.

-- 1. Create global_config table for runtime configuration
CREATE TABLE IF NOT EXISTS "global_config" (
    "config_key" VARCHAR(64) NOT NULL PRIMARY KEY,
    "config_value" TEXT NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Initialize default payment gateway configuration: Paddle as primary
INSERT INTO "global_config" ("config_key", "config_value")
VALUES ('active_payment_provider', 'paddle')
ON CONFLICT ("config_key") DO NOTHING;

-- 3. Add payment_provider column to subscriptions table
-- Defaults to 'paddle' for all new subscriptions
-- Existing subscriptions will be backfilled based on their gateway field
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "payment_provider" VARCHAR(16) NOT NULL DEFAULT 'paddle';

-- 4. Backfill existing subscriptions: map gateway enum to payment_provider string
UPDATE "subscriptions"
SET "payment_provider" = COALESCE(
    CASE
        WHEN "gateway" = 'paddle' THEN 'paddle'
        WHEN "gateway" = 'creem' THEN 'creem'
        ELSE 'paddle'
    END,
    'paddle'
);

-- 5. Add index on payment_provider for financial reconciliation queries
CREATE INDEX IF NOT EXISTS "subscriptions_payment_provider_idx" ON "subscriptions" ("payment_provider");
