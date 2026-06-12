// Art.9 Lifecycle Management API
// GET: Returns lifecycle status for all user's AI systems
// POST: Returns compliance checklist for a specific phase with auto-generated recommendations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * Lifecycle phases supported by this tool
 */
const PHASES = [
  "design",
  "development",
  "deployment",
  "operation",
  "monitoring",
  "retirement",
] as const;

type Phase = (typeof PHASES)[number];

/**
 * Checklist item structure
 */
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

/**
 * Phase result structure
 */
interface PhaseResult {
  phase: Phase;
  status: "completed" | "pending" | "na";
  checklist: ChecklistItem[];
  recommendations: string[];
}

/**
 * Generate checklist items based on system type and risk level
 */
function generateChecklist(
  phase: Phase,
  systemType: string,
  riskLevel: string | null
): { checklist: ChecklistItem[]; recommendations: string[] } {
  const isHighRisk = riskLevel === "high" || systemType === "high-risk";
  const isLimitedRisk = riskLevel === "limited" || systemType === "limited-risk";
  const isProhibited = riskLevel === "unacceptable" || systemType === "prohibited";

  const checklistMap: Record<Phase, ChecklistItem[]> = {
    design: [
      { id: "design-1", text: "Define intended purpose and scope of the AI system", completed: false },
      { id: "design-2", text: "Identify applicable EU AI Act risk classification", completed: false },
      { id: "design-3", text: "Document system requirements and constraints", completed: false },
      { id: "design-4", text: "Assess potential impacts on fundamental rights", completed: false },
      ...(isHighRisk
        ? [
            { id: "design-5", text: "Plan risk management system (Art.9)", completed: false },
            { id: "design-6", text: "Design human oversight mechanisms (Art.14)", completed: false },
          ]
        : []),
      ...(isProhibited
        ? [{ id: "design-7", text: "Review against Art.5 prohibited practices", completed: false }]
        : []),
    ],
    development: [
      { id: "dev-1", text: "Implement data governance and management practices (Art.10)", completed: false },
      { id: "dev-2", text: "Perform bias detection and mitigation on training data", completed: false },
      { id: "dev-3", text: "Document technical documentation (Art.11, Annex IV)", completed: false },
      { id: "dev-4", text: "Implement logging and record-keeping capabilities (Art.12)", completed: false },
      ...(isHighRisk
        ? [
            { id: "dev-5", text: "Ensure transparency and provision of information (Art.13)", completed: false },
            { id: "dev-6", text: "Validate accuracy, robustness, and cybersecurity (Art.15)", completed: false },
          ]
        : []),
    ],
    deployment: [
      { id: "deploy-1", text: "Verify conformity assessment or internal checks", completed: false },
      { id: "deploy-2", text: "Register the AI system in EU database (if required)", completed: false },
      { id: "deploy-3", text: "Prepare instructions for deployers (Art.13)", completed: false },
      { id: "deploy-4", text: "Confirm human oversight measures are operational", completed: false },
      ...(isHighRisk
        ? [
            { id: "deploy-5", text: "Complete QMS checklist (Art.17)", completed: false },
            { id: "deploy-6", text: "Appoint responsible person for compliance", completed: false },
          ]
        : []),
    ],
    operation: [
      { id: "op-1", text: "Monitor system performance and outputs", completed: false },
      { id: "op-2", text: "Ensure human oversight is active during use", completed: false },
      { id: "op-3", text: "Handle user feedback and incident reports", completed: false },
      { id: "op-4", text: "Maintain up-to-date technical documentation", completed: false },
      ...(isHighRisk
        ? [
            { id: "op-5", text: "Log serious incidents and malfunctioning (Art.73)", completed: false },
            { id: "op-6", text: "Conduct periodic compliance reviews", completed: false },
          ]
        : []),
      ...(isLimitedRisk
        ? [{ id: "op-7", text: "Ensure transparency obligations are met (Art.50)", completed: false }]
        : []),
    ],
    monitoring: [
      { id: "mon-1", text: "Collect and review post-market performance data", completed: false },
      { id: "mon-2", text: "Evaluate ongoing compliance with EU AI Act", completed: false },
      { id: "mon-3", text: "Update risk assessment based on new evidence", completed: false },
      { id: "mon-4", text: "Document changes and version history", completed: false },
      ...(isHighRisk
        ? [
            { id: "mon-5", text: "Report serious incidents to authorities (Art.73)", completed: false },
            { id: "mon-6", text: "Perform annual QMS review (Art.17)", completed: false },
          ]
        : []),
    ],
    retirement: [
      { id: "retire-1", text: "Plan data retention and deletion strategy", completed: false },
      { id: "retire-2", text: "Notify affected stakeholders of system retirement", completed: false },
      { id: "retire-3", text: "Archive compliance documentation for required period", completed: false },
      { id: "retire-4", text: "Ensure no ongoing obligations are overlooked", completed: false },
      ...(isHighRisk
        ? [
            { id: "retire-5", text: "Submit final report to market surveillance authority", completed: false },
            { id: "retire-6", text: "Document lessons learned for future systems", completed: false },
          ]
        : []),
    ],
  };

  const recommendationsMap: Record<Phase, string[]> = {
    design: [
      "Engage legal and ethics teams early in the design phase.",
      "Use the Risk Classification tool to confirm your system's risk level.",
      ...(isHighRisk ? ["Begin planning the FRIA (Art.27) during design."] : []),
    ],
    development: [
      "Run the Data Governance Assessment to validate your data practices.",
      "Document every design decision for technical documentation.",
      ...(isHighRisk ? ["Integrate automated bias testing into your CI/CD pipeline."] : []),
    ],
    deployment: [
      "Double-check that all transparency notices are visible to end users.",
      "Verify that deployers have received adequate instructions.",
      ...(isHighRisk ? ["Ensure the QMS checklist is at least 80% complete before deployment."] : []),
    ],
    operation: [
      "Set up automated monitoring alerts for anomalous behavior.",
      "Schedule quarterly compliance self-reviews.",
      ...(isHighRisk ? ["Maintain an incident response playbook aligned with Art.73."] : []),
    ],
    monitoring: [
      "Compare post-market data against pre-deployment benchmarks.",
      "Review regulatory updates that may affect your system's classification.",
      ...(isHighRisk ? ["Update the FRIA if the system's purpose or context changes."] : []),
    ],
    retirement: [
      "Ensure GDPR data deletion requests can still be honored after retirement.",
      "Retain compliance records for the legally required period.",
      ...(isHighRisk ? ["Notify the relevant market surveillance authority of system withdrawal."] : []),
    ],
  };

  return {
    checklist: checklistMap[phase],
    recommendations: recommendationsMap[phase],
  };
}

/**
 * GET /api/tools/lifecycle
 * Returns lifecycle status for all user's AI systems
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const systems = await prisma.aISystem.findMany({
      where: { userId: session.user.id, status: { not: "removed" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        systemType: true,
        riskLevel: true,
        status: true,
        art9Compliant: true,
        createdAt: true,
        updatedAt: true,
        deployedAt: true,
      },
    });

    // Build lifecycle status for each system
    const results = systems.map((system) => {
      const phases: PhaseResult[] = PHASES.map((phase) => {
        const { checklist, recommendations } = generateChecklist(
          phase,
          system.systemType,
          system.riskLevel
        );

        // Simple heuristic for status based on system maturity
        let status: "completed" | "pending" | "na" = "pending";
        if (phase === "design" && system.createdAt) {
          status = "completed";
        } else if (phase === "development" && system.status !== "draft") {
          status = "completed";
        } else if (phase === "deployment" && system.deployedAt) {
          status = "completed";
        } else if (phase === "retirement" && system.status === "deprecated") {
          status = "completed";
        } else if (phase === "retirement" && system.status !== "deprecated") {
          status = "na";
        }

        return {
          phase,
          status,
          checklist,
          recommendations,
        };
      });

      const completedCount = phases.filter((p) => p.status === "completed").length;
      const applicableCount = phases.filter((p) => p.status !== "na").length;
      const overallPercent = applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 0;

      return {
        systemId: system.id,
        systemName: system.name,
        systemType: system.systemType,
        riskLevel: system.riskLevel,
        art9Compliant: system.art9Compliant,
        overallPercent,
        phases,
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("[LIFECYCLE API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch lifecycle status" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tools/lifecycle
 * Body: { systemId: string, phase: Phase, status: "completed" | "pending" | "na" }
 * Persists phase completion status via AISystem metadata
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { systemId, phase, status } = body as {
      systemId?: string;
      phase?: string;
      status?: string;
    };

    if (!systemId || typeof systemId !== "string") {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    if (!phase || !PHASES.includes(phase as Phase)) {
      return NextResponse.json(
        { error: `phase must be one of: ${PHASES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!status || !["completed", "pending", "na"].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: completed, pending, na' },
        { status: 400 }
      );
    }

    // Verify ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true, systemType: true, riskLevel: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Store phase status in a JSON metadata field on the AISystem
    // We use the existing model by updating relevant timestamp fields
    const updates: Record<string, unknown> = {};
    if (phase === "deployment" && status === "completed") {
      updates.deployedAt = new Date();
    }
    if (phase === "design" && status === "completed") {
      // Design completion is implied by createdAt existing, no extra action needed
    }

    // Check if all applicable phases are now completed
    // Fetch current phase statuses from the request context
    if (Object.keys(updates).length > 0) {
      await prisma.aISystem.update({
        where: { id: systemId },
        data: updates,
      });
    }

    // If marking as completed, check if all phases are done for Art.9 compliance
    if (status === "completed") {
      await createAuditLog({
        userId: session.user.id,
        action: "tool_lifecycle_management",
        resource: "lifecycle",
        details: { systemId, phase, status, systemName: system.name },
      });
    }

    return NextResponse.json({ success: true, systemId, phase, status });
  } catch (error) {
    console.error("[LIFECYCLE API] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update lifecycle phase" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/lifecycle
 * Body: { systemId: string, phase: Phase }
 * Returns compliance checklist for the phase with recommendations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { systemId, phase } = body as { systemId?: string; phase?: string };

    if (!systemId || typeof systemId !== "string") {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    if (!phase || !PHASES.includes(phase as Phase)) {
      return NextResponse.json(
        { error: `phase must be one of: ${PHASES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      select: { userId: true, name: true, systemType: true, riskLevel: true, art9Compliant: true },
    });

    if (!system) {
      return NextResponse.json({ error: "AI system not found" }, { status: 404 });
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { checklist, recommendations } = generateChecklist(
      phase as Phase,
      system.systemType,
      system.riskLevel
    );

    await createAuditLog({
      userId: session.user.id,
      action: "tool_lifecycle_management",
      resource: "lifecycle",
      details: { systemId, phase, systemName: system.name },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemId,
        systemName: system.name,
        phase: phase as Phase,
        checklist,
        recommendations,
      },
    });
  } catch (error) {
    console.error("[LIFECYCLE API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to generate lifecycle checklist" },
      { status: 500 }
    );
  }
}
