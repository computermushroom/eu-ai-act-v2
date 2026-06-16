// Paddle Payment Webhook Handler (Reserved)
// POST endpoint for Paddle webhook events
// Currently returns 200 immediately when Paddle is not configured
// Full Paddle webhook processing logic is commented out for future activation

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/webhook/paddle
 * Receives and processes Paddle webhook events
 *
 * PADDLE: 预留代码 - 后期启用
 * When Paddle is activated, uncomment the full implementation below
 * and set PADDLE_WEBHOOK_SECRET in environment variables.
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  // Return early if Paddle is not configured
  if (!webhookSecret) {
    return NextResponse.json({
      received: true,
      message: "Paddle webhook not configured",
    });
  }

  /* PADDLE: 预留代码 - 后期启用 */
  /*
  try {
    const rawBody = await request.text();

    // Get the Paddle gateway adapter
    // Note: When activating Paddle, ensure PAYMENT_GATEWAY=paddle is set
    // or import PaddleAdapter directly:
    // import { PaddleAdapter } from "@/lib/payment/paddle-adapter";
    // const gateway = new PaddleAdapter();

    import { getPaymentGateway } from "@/lib/payment";
    const gateway = getPaymentGateway();

    // Verify webhook signature and parse payload
    const verifyResult = await gateway.verifyWebhook(rawBody, request.headers);

    if (!verifyResult.valid) {
      console.error("[Paddle Webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    console.log(
      `[Paddle Webhook] Received event: ${verifyResult.event} for subscription ${verifyResult.data.gatewaySubscriptionId}`
    );

    // Process the webhook data via unified handler
    import { processWebhookData } from "@/lib/payment/webhook-handler";
    await processWebhookData(verifyResult.data);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paddle Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
  */

  // Placeholder response when Paddle is configured but handler is not yet active
  return NextResponse.json({
    received: true,
    message: "Paddle webhook handler reserved for future activation",
  });
}
