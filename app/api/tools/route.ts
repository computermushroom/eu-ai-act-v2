// Tools API
// GET: Returns list of available compliance tools
// Now queries from database training_modules table for dynamic tool management

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

interface ToolInfo {
  id: string;
  title: string;
  description: string;
  articleRef: string;
  href: string;
  tier: string;
  isActive: boolean;
}

/**
 * Static tool definitions as fallback
 * These represent the core compliance tools mapped to EU AI Act articles
 */
const STATIC_TOOLS: ToolInfo[] = [
  {
    id: "risk-assessment",
    title: "Risk Classification",
    description:
      "Art.6 self-assessment for AI system risk levels (unacceptable, high, limited, minimal)",
    articleRef: "Art.6",
    href: "/tools/risk-assessment",
    tier: "free",
    isActive: true,
  },
  {
    id: "prohibited-practices",
    title: "Prohibited Practices",
    description: "Check your system against Art.5 banned AI practices",
    articleRef: "Art.5",
    href: "/tools/prohibited-practices",
    tier: "starter",
    isActive: true,
  },
  {
    id: "transparency",
    title: "Transparency Check",
    description: "Verify Art.50 transparency obligations for AI systems",
    articleRef: "Art.50",
    href: "/tools/transparency",
    tier: "starter",
    isActive: true,
  },
  {
    id: "url-scan",
    title: "URL Compliance Scan",
    description:
      "Scan any URL for AI compliance indicators, GDPR notices, and risk markers",
    articleRef: "General",
    href: "/tools/url-scan",
    tier: "free",
    isActive: true,
  },
  {
    id: "data-governance",
    title: "Data Governance",
    description: "Art.10 data governance and training data compliance assessment",
    articleRef: "Art.10",
    href: "/tools/data-governance",
    tier: "professional",
    isActive: true,
  },
  {
    id: "specialized-checks",
    title: "Specialized Compliance Checks",
    description: "Industry-specific compliance checks for healthcare, finance, legal, and more",
    articleRef: "Annex III",
    href: "/tools/specialized-checks",
    tier: "professional",
    isActive: true,
  },
  {
    id: "fria",
    title: "FRIA Assessment",
    description: "Fundamental Rights Impact Assessment (Art.27) for high-risk AI systems",
    articleRef: "Art.27",
    href: "/tools/fria",
    tier: "professional",
    isActive: true,
  },
  {
    id: "qms",
    title: "QMS Checklist",
    description: "Quality Management System checklist (Art.17) for AI providers",
    articleRef: "Art.17",
    href: "/tools/qms",
    tier: "business",
    isActive: true,
  },
  {
    id: "shadow-ai",
    title: "Shadow AI Scan",
    description: "Detect unauthorized AI tool usage across your organization",
    articleRef: "General",
    href: "/tools/shadow-ai",
    tier: "business",
    isActive: true,
  },
  {
    id: "lifecycle",
    title: "Lifecycle Management",
    description: "Full AI system lifecycle compliance tracking from design to post-market",
    articleRef: "Art.8-15",
    href: "/tools/lifecycle",
    tier: "business",
    isActive: true,
  },
];

/**
 * GET /api/tools
 * Returns available compliance tools
 * Attempts to fetch from database first, falls back to static definitions
 */
export async function GET() {
  const session = await auth();

  try {
    // Try to fetch active tools from database
    const dbTools = await prisma.trainingModule.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        articleRef: true,
        difficulty: true,
        order: true,
        isActive: true,
      },
    });

    // Map database tools to ToolInfo format
    const tools: ToolInfo[] =
      dbTools.length > 0
        ? dbTools.map((tool) => ({
            id: tool.id,
            title: tool.title,
            description: tool.description ?? "",
            articleRef: tool.articleRef ?? "General",
            href: `/tools/${tool.id}`,
            tier: mapDifficultyToTier(tool.difficulty),
            isActive: tool.isActive,
          }))
        : STATIC_TOOLS;

    // Audit log for authenticated users
    if (session?.user?.id) {
      await createAuditLog({
        userId: session.user.id,
        action: "tool_risk_assessment",
        resource: "tools-list",
        details: { toolCount: tools.length, source: dbTools.length > 0 ? "database" : "static" },
      });
    }

    return NextResponse.json({ tools });
  } catch (error) {
    console.error("[TOOLS API] Error fetching tools:", error);

    // Fallback to static tools on database error
    return NextResponse.json({
      tools: STATIC_TOOLS,
      fallback: true,
      error: "Database unavailable, serving static tool list",
    });
  }
}

/**
 * Map training module difficulty to subscription tier
 */
function mapDifficultyToTier(difficulty: string): string {
  switch (difficulty) {
    case "beginner":
      return "free";
    case "intermediate":
      return "starter";
    case "advanced":
      return "professional";
    case "expert":
      return "business";
    default:
      return "free";
  }
}
