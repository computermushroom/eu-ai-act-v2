// Creem Payment Webhook Handler
// Processes subscription events from Creem payment gateway (BACKUP)
// Security: HMAC-SHA256 signature verification via Creem adapter
// Delegates to unified webhook handler for database operations
//
// This route is ALWAYS active regardless of the current global gateway setting.
// Existing Creem subscriptions continue to receive webhooks even if
// the admin switches new checkouts to Paddle.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyWebhook, processWebhookData } from "@/lib/payment";

/**
 * POST /api/payment/webhook/creem
 * Receives and processes Creem webhook events
 * Verifies signature, parses event, updates database via unified handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature using Creem strategy directly
    const verifyResult = await verifyWebhook(rawBody, request.headers, "creem");

    if (!verifyResult.valid) {
      console.error("[Creem Webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log(
      `[Creem Webhook] Received event: ${verifyResult.event} ` +
      `for subscription ${verifyResult.data.gatewaySubscriptionId} ` +
      `(provider: creem)`
    );

    // Process the webhook data via unified handler
    await processWebhookData(verifyResult.data);

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[Creem Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
