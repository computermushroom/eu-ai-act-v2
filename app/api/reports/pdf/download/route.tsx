// PDF Report Download API
// GET: Generates and returns a real PDF compliance report
// Uses @react-pdf/renderer for server-side PDF generation
// Rate-limited to 5 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";
import { pdf } from "@react-pdf/renderer";
import { ComplianceReportDocument } from "@/components/tools/ComplianceReportPDF";
import type { ReportData, ComplianceItem } from "@/components/tools/ComplianceReportPDF";

const downloadSchema = z.object({
  systemId: z.string().min(1, "System ID is required"),
  type: z.enum([
    "compliance-summary",
    "risk-assessment",
    "fria",
    "qms",
    "data-governance",
  ]),
  locale: z.string().min(2).max(5).default("en"),
});

const limiter = createRateLimiter("export");

/**
 * GET /api/reports/pdf/download?systemId=xxx&type=xxx&locale=en
 * Generates and returns a real PDF compliance report as binary download
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);
    const parsed = downloadSchema.safeParse({
      systemId: searchParams.get("systemId"),
      type: searchParams.get("type") || "compliance-summary",
      locale: searchParams.get("locale") || "en",
    });

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { systemId, type, locale } = parsed.data;

    // Verify AI system ownership
    const system = await prisma.aISystem.findUnique({
      where: { id: systemId },
      include: {
        scanResults: { orderBy: { createdAt: "desc" }, take: 5 },
        qms: true,
        fria: true,
        documents: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!system) {
      return NextResponse.json(
        { error: "AI system not found" },
        { status: 404 }
      );
    }

    if (system.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build report data for the PDF document
    const reportData = buildReportData(system, type, locale);

    // Generate real PDF using @react-pdf/renderer
    const pdfDocument = <ComplianceReportDocument data={reportData} />;
    const pdfNodeStream = await pdf(pdfDocument).toBuffer();
    // Convert NodeJS.ReadableStream to Buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfNodeStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfNodeStream.on("end", () => resolve(Buffer.concat(chunks)));
      pdfNodeStream.on("error", reject);
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "report_downloaded",
      resource: "pdf-report",
      details: { systemId, reportType: type, locale },
    });

    // Build filename
    const filename = `EU-AI-Act-Report-${system.name.replace(/\s+/g, "-")}-${type}-${new Date().toISOString().split("T")[0]}.pdf`;

    // Return real PDF binary
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, max-age=0",
        "X-Report-Type": type,
        "X-System-Id": systemId,
      },
    });
  } catch (error) {
    console.error("[PDF DOWNLOAD] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}

// ─── EU AI Act Article Descriptions ────────────────────────────────
const ARTICLE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  "Art.6": {
    title: "Risk Classification",
    description:
      "Requires AI systems to be classified according to their risk level (unacceptable, high, limited, minimal). High-risk systems must meet additional requirements under Title III of the regulation.",
  },
  "Art.9": {
    title: "Risk Management",
    description:
      "Mandates establishment of a continuous risk management process including identification, analysis, and mitigation of risks throughout the AI system lifecycle.",
  },
  "Art.10": {
    title: "Data Governance",
    description:
      "Requires training, validation, and testing data to be relevant, representative, free of errors, and complete. Data governance practices must be documented and maintained.",
  },
  "Art.12": {
    title: "Record Keeping",
    description:
      "Mandates automatic logging of the AI system's operation to ensure traceability. Logs must include sufficient information for post-deployment monitoring and regulatory review.",
  },
  "Art.13": {
    title: "Transparency",
    description:
      "Requires providers to ensure AI systems are designed and developed with sufficient transparency to enable deployers to interpret system output and use it appropriately.",
  },
  "Art.14": {
    title: "Human Oversight",
    description:
      "Requires high-risk AI systems to be designed for effective human oversight by natural persons during use, enabling humans to understand, monitor, and intervene in system operation.",
  },
  "Art.15": {
    title: "Accuracy",
    description:
      "Mandates appropriate levels of accuracy, robustness, and cybersecurity throughout the system lifecycle, with mitigation measures for known and foreseeable risks.",
  },
  "Art.17": {
    title: "Quality Management System",
    description:
      "Requires providers of high-risk AI systems to establish a QMS covering quality policy, objectives, procedures, and responsibilities for compliance with the regulation.",
  },
  "Art.27": {
    title: "Fundamental Rights Impact Assessment",
    description:
      "Requires deployers of high-risk AI systems in certain contexts to conduct a FRIA evaluating impacts on fundamental rights, including privacy, non-discrimination, and freedom of expression.",
  },
};

// ─── Build Report Data ─────────────────────────────────────────────
/**
 * Transforms database system data into the ReportData structure
 * expected by the ComplianceReportDocument component.
 */
function buildReportData(
  system: {
    id: string;
    name: string;
    description: string | null;
    systemType: string;
    riskLevel: string | null;
    status: string;
    industry: string | null;
    art6Compliant: boolean;
    art9Compliant: boolean;
    art10Compliant: boolean;
    art12Compliant: boolean;
    art13Compliant: boolean;
    art14Compliant: boolean;
    art15Compliant: boolean;
    art17Compliant: boolean;
    art27Compliant: boolean;
    createdAt: Date;
    updatedAt: Date;
    scanResults: { scanType: string; score: number; status: string; createdAt: Date }[];
    qms: { completionRate: number; status: string } | null;
    fria: { status: string; overallScore: number | null } | null;
    documents: { title: string; type: string; status: string }[];
  },
  reportType: string,
  locale: string
): ReportData {
  const generatedAt = new Date().toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reportId = `RPT-${system.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

  // Build compliance items with article descriptions
  const complianceItems: ComplianceItem[] = [
    {
      art: "Art.6",
      title: "Risk Classification",
      description: ARTICLE_DESCRIPTIONS["Art.6"]?.description || "Risk classification according to EU AI Act Article 6",
      compliant: system.art6Compliant,
      details: system.art6Compliant
        ? "System risk classification is properly documented and aligned with Art.6 criteria."
        : "System risk classification does not meet Art.6 requirements. A proper risk classification assessment must be conducted.",
    },
    {
      art: "Art.9",
      title: "Risk Management",
      description: ARTICLE_DESCRIPTIONS["Art.9"]?.description || "",
      compliant: system.art9Compliant,
      details: system.art9Compliant
        ? "Risk management system is established and operational per Art.9 requirements."
        : "Risk management processes are insufficient. A continuous risk management framework must be implemented.",
    },
    {
      art: "Art.10",
      title: "Data Governance",
      description: ARTICLE_DESCRIPTIONS["Art.10"]?.description || "",
      compliant: system.art10Compliant,
      details: system.art10Compliant
        ? "Data governance practices meet Art.10 requirements for training, validation, and testing data."
        : "Data governance practices are deficient. Data quality management and documentation must be improved.",
    },
    {
      art: "Art.12",
      title: "Record Keeping",
      description: ARTICLE_DESCRIPTIONS["Art.12"]?.description || "",
      compliant: system.art12Compliant,
      details: system.art12Compliant
        ? "Automatic logging and record keeping mechanisms are in place as required by Art.12."
        : "Record keeping practices are inadequate. Automatic logging must be implemented for system traceability.",
    },
    {
      art: "Art.13",
      title: "Transparency",
      description: ARTICLE_DESCRIPTIONS["Art.13"]?.description || "",
      compliant: system.art13Compliant,
      details: system.art13Compliant
        ? "System transparency requirements under Art.13 are satisfied."
        : "Transparency measures are insufficient. The system must provide adequate interpretability for deployers.",
    },
    {
      art: "Art.14",
      title: "Human Oversight",
      description: ARTICLE_DESCRIPTIONS["Art.14"]?.description || "",
      compliant: system.art14Compliant,
      details: system.art14Compliant
        ? "Human oversight mechanisms are properly designed and implemented per Art.14."
        : "Human oversight capabilities are lacking. Effective human intervention mechanisms must be integrated.",
    },
    {
      art: "Art.15",
      title: "Accuracy",
      description: ARTICLE_DESCRIPTIONS["Art.15"]?.description || "",
      compliant: system.art15Compliant,
      details: system.art15Compliant
        ? "Accuracy, robustness, and cybersecurity requirements of Art.15 are met."
        : "Accuracy and robustness measures are insufficient. Performance metrics and mitigation strategies must be improved.",
    },
    {
      art: "Art.17",
      title: "Quality Management System",
      description: ARTICLE_DESCRIPTIONS["Art.17"]?.description || "",
      compliant: system.art17Compliant,
      details: system.art17Compliant
        ? "Quality management system is established and meets Art.17 requirements."
        : "QMS is not fully compliant with Art.17. Quality policy, procedures, and documentation must be completed.",
    },
    {
      art: "Art.27",
      title: "Fundamental Rights Impact Assessment",
      description: ARTICLE_DESCRIPTIONS["Art.27"]?.description || "",
      compliant: system.art27Compliant,
      details: system.art27Compliant
        ? "Fundamental rights impact assessment has been conducted as required by Art.27."
        : "FRIA has not been completed or is non-compliant. An assessment of fundamental rights impacts must be conducted.",
    },
  ];

  // Filter compliance items based on report type
  let filteredItems: ComplianceItem[] = complianceItems;
  switch (reportType) {
    case "risk-assessment":
      filteredItems = [
        complianceItems[0], // Art.6
        complianceItems[1], // Art.9
      ].filter(Boolean) as ComplianceItem[];
      break;
    case "fria":
      filteredItems = [complianceItems[8]].filter(Boolean) as ComplianceItem[]; // Art.27
      break;
    case "qms":
      filteredItems = [complianceItems[7]].filter(Boolean) as ComplianceItem[]; // Art.17
      break;
    case "data-governance":
      filteredItems = [complianceItems[2]].filter(Boolean) as ComplianceItem[]; // Art.10
      break;
    // compliance-summary uses all items
  }

  return {
    systemName: system.name,
    systemType: system.systemType,
    riskLevel: system.riskLevel ?? "Not classified",
    status: system.status,
    industry: system.industry,
    description: system.description,
    createdAt: system.createdAt,
    updatedAt: system.updatedAt,
    reportType,
    reportId,
    generatedAt,
    locale,
    complianceItems: filteredItems,
    scanResults: system.scanResults,
    qms: system.qms,
    fria: system.fria,
    documents: system.documents,
  };
}
