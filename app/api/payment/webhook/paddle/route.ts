// Paddle Payment Webhook Handler
// Processes subscription events from Paddle payment gateway (PRIMARY)
// Security: HMAC-SHA256 signature verification via Paddle adapter
// Delegates to unified webhook handler for database operations
//
// This route is ALWAYS active regardless of the current global gateway setting.
// Existing Paddle subscriptions continue to receive webhooks even if
// the admin switches new checkouts to Creem.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyWebhook, processWebhookData } from "@/lib/payment";

/**
 * POST /api/payment/webhook/paddle
 * Receives and processes Paddle webhook events
 * Verifies signature, parses event, updates database via unified handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature using Paddle strategy directly
    const verifyResult = await verifyWebhook(rawBody, request.headers, "paddle");

    if (!verifyResult.valid) {
      console.error("[Paddle Webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log(
      `[Paddle Webhook] Received event: ${verifyResult.event} ` +
      `for subscription ${verifyResult.data.gatewaySubscriptionId} ` +
      `(provider: paddle)`
    );

    // Process the webhook data via unified handler
    await processWebhookData(verifyResult.data);

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[Paddle Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
