// Shadow AI Scan API
// POST: Scan code and dependencies for unauthorized shadow AI tools
// Rate-limited to 20 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scanShadowAI } from "@/lib/shadow-ai-scanner";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";
import { requireTier } from "@/lib/subscription-guard";
import { prisma } from "@/lib/prisma";

const shadowAISchema = z.object({
  organization: z.string().min(1, "Organization name is required").max(200, "Organization name too long"),
  domain: z.string().max(253, "Domain too long").optional(),
  codeSnippet: z.string().max(50000, "Code snippet too large").optional(),
  packageJson: z.string().max(50000, "package.json too large").optional(),
  requirements: z.string().max(50000, "requirements.txt too large").optional(),
  systemId: z.string().optional(),
});

const limiter = createRateLimiter("scan");

/**
 * POST /api/tools/shadow-ai
 * Scans code and dependencies for shadow AI tool usage
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier("business")(request);
  if (tierCheck) return tierCheck;

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

    const { organization, domain, codeSnippet, packageJson, requirements, systemId } = parsed.data;

    // Run the real shadow AI scan
    const result = await scanShadowAI(organization, domain, codeSnippet, packageJson, requirements);

    // Store result in ScanResult table if systemId provided
    if (systemId) {
      try {
        await prisma.scanResult.create({
          data: {
            systemId,
            scanType: "shadow-ai",
            score: result.riskScore,
            status: result.riskScore >= 50 ? "fail" : result.riskScore >= 25 ? "warning" : "pass",
            findings: JSON.stringify({
              detectedTools: result.detectedTools,
              remediationSteps: result.remediationSteps,
              summary: result.summary,
            }),
          },
        });
      } catch (dbError) {
        console.error("[SHADOW AI SCAN] Failed to store scan result:", dbError);
        // Non-blocking: continue even if DB write fails
      }
    }

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
        systemId: systemId ?? null,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[SHADOW AI SCAN] Error:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
