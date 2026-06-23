// FastSpring Webhook Endpoint
// POST: Receives and processes FastSpring webhook events
// Validates HMAC signature, processes events idempotently

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  processWebhook,
} from "@/lib/payment";

/**
 * POST /api/payment/webhook/fastspring
 * FastSpring webhook receiver
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw payload for signature verification
    const payload = await request.text();

    // Verify HMAC signature from X-FS-Signature header
    const signature = request.headers.get("x-fs-signature") ?? "";

    if (!signature) {
      console.warn("[WEBHOOK] Missing X-FS-Signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 400 }
      );
    }

    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.error("[WEBHOOK] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse payload
    let webhookPayload;
    try {
      webhookPayload = JSON.parse(payload);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Process events
    const result = await processWebhook(webhookPayload);

    if (result.errors.length > 0) {
      console.error("[WEBHOOK] Processing errors:", result.errors);
      // Return 200 to prevent FastSpring retries for non-retryable errors
      // Log errors for manual investigation
    }

    console.log(
      `[WEBHOOK] Processed ${result.processed} events, ${result.errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors.length,
    });
  } catch (error) {
    console.error("[WEBHOOK] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/webhook/fastspring
 * Health check for webhook endpoint (used by monitoring)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    gateway: "fastspring",
    timestamp: new Date().toISOString(),
  });
}
