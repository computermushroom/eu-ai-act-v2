// Shadow AI Scan API
// POST: Scan an organization for unauthorized shadow AI tools
// Rate-limited to 20 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scanShadowAI } from "@/lib/shadow-ai-scanner";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

const shadowAISchema = z.object({
  organization: z.string().min(1, "Organization name is required").max(200, "Organization name too long"),
  domain: z.string().max(253, "Domain too long").optional(),
});

const limiter = createRateLimiter("scan");

/**
 * POST /api/tools/shadow-ai
 * Scans an organization for shadow AI tool usage
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
    const parsed = shadowAISchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { organization, domain } = parsed.data;

    // Run the shadow AI scan
    const result = await scanShadowAI(organization, domain);

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "tool_shadow_ai_scan",
      resource: "shadow-ai",
      details: {
        organization: result.organization,
        domain: result.domain,
        riskScore: result.riskScore,
        detectedCount: result.detectedTools.length,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[SHADOW AI SCAN] Error:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
