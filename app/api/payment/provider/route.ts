// Payment Provider Info API
// GET: Returns the currently active payment gateway for frontend SDK loading
// Public endpoint — no authentication required (only returns gateway type, no secrets)

import { NextResponse } from "next/server";
import { getPaymentProviderInfo } from "@/lib/payment";

/**
 * GET /api/payment/provider
 * Returns active payment gateway info for frontend dynamic SDK loading
 */
export async function GET(): Promise<NextResponse> {
  try {
    const info = await getPaymentProviderInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("[PAYMENT PROVIDER GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment provider info" },
      { status: 500 }
    );
  }
}
