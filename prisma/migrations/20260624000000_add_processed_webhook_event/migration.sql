-- CreateTable: processed_webhook_events
-- Purpose: Track FastSpring webhook event IDs for idempotent processing
-- Prevents duplicate subscription updates from webhook retries

CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- Create unique index on eventId for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS "processed_webhook_events_eventId_key" ON "processed_webhook_events"("eventId");

-- Create index on eventId for fast lookups
CREATE INDEX IF NOT EXISTS "processed_webhook_events_eventId_idx" ON "processed_webhook_events"("eventId");
