// Training Module API (Enterprise tier)
// GET: Lists all TrainingModules with user's progress
// POST: { moduleId } starts/completes a module (simulated)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * Default training modules to seed if none exist
 */
const DEFAULT_MODULES = [
  {
    title: "EU AI Act Basics",
    description: "Fundamental concepts and scope of the EU AI Act (Articles 1-4).",
    articleRef: "Art.1-4",
    difficulty: "beginner",
    duration: 15,
    order: 1,
    content: JSON.stringify({
      sections: [
        { title: "Introduction", text: "Overview of the EU AI Act and its objectives." },
        { title: "Scope", text: "Understanding which AI systems fall under the regulation." },
        { title: "Definitions", text: "Key terms and definitions used throughout the Act." },
      ],
    }),
  },
  {
    title: "Risk Classification Guide",
    description: "Learn how to classify AI systems by risk level under Article 6.",
    articleRef: "Art.6",
    difficulty: "beginner",
    duration: 20,
    order: 2,
    content: JSON.stringify({
      sections: [
        { title: "Risk Categories", text: "Unacceptable, high, limited, and minimal risk." },
        { title: "Classification Criteria", text: "How to determine the risk level of your AI system." },
        { title: "Examples", text: "Real-world examples of each risk category." },
      ],
    }),
  },
  {
    title: "Prohibited Practices",
    description: "Understand AI practices banned under Article 5.",
    articleRef: "Art.5",
    difficulty: "beginner",
    duration: 15,
    order: 3,
    content: JSON.stringify({
      sections: [
        { title: "Banned Practices", text: "List of prohibited AI applications." },
        { title: "Exceptions", text: "Limited exceptions for law enforcement and public safety." },
        { title: "Penalties", text: "Consequences of non-compliance." },
      ],
    }),
  },
  {
    title: "Transparency Requirements",
    description: "Obligations for transparency under Article 50.",
    articleRef: "Art.50",
    difficulty: "intermediate",
    duration: 20,
    order: 4,
    content: JSON.stringify({
      sections: [
        { title: "Disclosure Obligations", text: "When and how to disclose AI use." },
        { title: "User Notification", text: "Notifying users that they are interacting with AI." },
        { title: "Documentation", text: "Required transparency documentation." },
      ],
    }),
  },
  {
    title: "High-Risk System Obligations",
    description: "Comprehensive obligations for high-risk AI systems (Articles 8-15).",
    articleRef: "Art.8-15",
    difficulty: "intermediate",
    duration: 30,
    order: 5,
    content: JSON.stringify({
      sections: [
        { title: "Risk Management", text: "Establishing a risk management system." },
        { title: "Data Governance", text: "Training data quality and governance." },
        { title: "Technical Documentation", text: "Documentation requirements for high-risk systems." },
        { title: "Human Oversight", text: "Implementing effective human oversight." },
      ],
    }),
  },
  {
    title: "FRIA Deep Dive",
    description: "Fundamental Rights Impact Assessment in detail (Article 27).",
    articleRef: "Art.27",
    difficulty: "advanced",
    duration: 45,
    order: 6,
    content: JSON.stringify({
      sections: [
        { title: "When FRIA is Required", text: "Identifying systems that need a FRIA." },
        { title: "Assessment Steps", text: "Step-by-step guide to conducting a FRIA." },
        { title: "Stakeholder Consultation", text: "Engaging with affected stakeholders." },
        { title: "Mitigation Measures", text: "Documenting risk mitigation strategies." },
      ],
    }),
  },
  {
    title: "QMS Implementation",
    description: "Implementing a Quality Management System under Article 17.",
    articleRef: "Art.17",
    difficulty: "advanced",
    duration: 40,
    order: 7,
    content: JSON.stringify({
      sections: [
        { title: "QMS Components", text: "Key elements of an AI QMS." },
        { title: "Documentation", text: "Required policies and procedures." },
        { title: "Monitoring", text: "Post-market monitoring and incident reporting." },
        { title: "Audits", text: "Internal audits and management review." },
      ],
    }),
  },
  {
    title: "Data Governance",
    description: "Data governance requirements for AI systems under Article 10.",
    articleRef: "Art.10",
    difficulty: "intermediate",
    duration: 25,
    order: 8,
    content: JSON.stringify({
      sections: [
        { title: "Data Quality", text: "Ensuring high-quality training data." },
        { title: "Bias Mitigation", text: "Detecting and mitigating bias in datasets." },
        { title: "Privacy", text: "GDPR compliance and data protection." },
      ],
    }),
  },
];

/**
 * Seed default training modules if the table is empty
 */
async function seedTrainingModules(): Promise<void> {
  const count = await prisma.trainingModule.count();
  if (count === 0) {
    await prisma.trainingModule.createMany({
      data: DEFAULT_MODULES,
    });
  }
}

/**
 * GET /api/training
 * Lists all TrainingModules with the current user's progress
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await seedTrainingModules();

    const modules = await prisma.trainingModule.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        progress: {
          where: { userId: session.user.id },
        },
      },
    });

    const enriched = modules.map((mod) => {
      const userProgress = mod.progress[0];
      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        articleRef: mod.articleRef,
        difficulty: mod.difficulty,
        duration: mod.duration,
        order: mod.order,
        progress: userProgress
          ? {
              status: userProgress.status,
              score: userProgress.score,
              completedAt: userProgress.completedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      modules: enriched,
    });
  } catch (error) {
    console.error("[TRAINING API] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch training modules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training
 * Body: { moduleId: string }
 * Starts or completes a training module (simulated completion after 1 second)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { moduleId } = body as { moduleId?: string };

    if (!moduleId) {
      return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
    }

    await seedTrainingModules();

    // Verify module exists
    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return NextResponse.json({ error: "Training module not found" }, { status: 404 });
    }

    // Upsert progress: if already completed, keep it; otherwise mark as completed
    const existing = await prisma.trainingProgress.findUnique({
      where: { userId_moduleId: { userId: session.user.id, moduleId } },
    });

    if (existing?.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Module already completed",
        progress: existing,
      });
    }

    // Simulate completion delay (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const progress = await prisma.trainingProgress.upsert({
      where: { userId_moduleId: { userId: session.user.id, moduleId } },
      create: {
        userId: session.user.id,
        moduleId,
        status: "completed",
        score: 100,
        completedAt: new Date(),
      },
      update: {
        status: "completed",
        score: 100,
        completedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "training_completed",
      resource: `training-module:${moduleId}`,
      details: {
        moduleId,
        moduleTitle: module.title,
        score: progress.score,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Module completed successfully",
      progress,
    });
  } catch (error) {
    console.error("[TRAINING API] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to complete training module" },
      { status: 500 }
    );
  }
}
