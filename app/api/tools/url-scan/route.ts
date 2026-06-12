// URL Scan API
// POST: Scan a URL for EU AI Act compliance indicators
// Rate-limited to 20 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scanUrl } from "@/lib/url-scanner";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

const urlScanSchema = z.object({
  url: z.string().url("Invalid URL format").max(2048, "URL too long"),
});

const limiter = createRateLimiter("scan");

/**
 * POST /api/tools/url-scan
 * Scans a URL for AI compliance indicators
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = limiter(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = urlScanSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { url } = parsed.data;

    // Run the scan
    const result = await scanUrl(url);

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_risk_assessment",
      resource: "url-scan",
      details: {
        url,
        score: result.overallScore,
        checksCount: result.checks.length,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[URL SCAN] Error:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
