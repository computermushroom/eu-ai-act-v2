// PDF Report Generation API
// POST: Generates a PDF compliance report using @react-pdf/renderer
// Rate-limited to 5 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";

const reportSchema = z.object({
  systemId: z.string().min(1, "System ID is required"),
  reportType: z.enum([
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
 * POST /api/reports/pdf
 * Generates a PDF compliance report for a specific AI system
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
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { systemId, reportType, locale } = parsed.data;

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

    // Build report data based on type
    const reportData = buildReportData(system, reportType, locale);

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "report_generated",
      resource: "pdf-report",
      details: { systemId, reportType, locale },
    });

    return NextResponse.json({
      success: true,
      reportData,
      downloadUrl: `/api/reports/pdf/download?systemId=${systemId}&type=${reportType}&locale=${locale}`,
    });
  } catch (error) {
    console.error("[PDF REPORT API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

/**
 * Build report data structure for PDF generation
 */
type ReportSection = {
  title: string;
  items: { label: string; value: string; riskLevel?: string }[];
};

function buildReportData(
  system: {
    id: string;
    name: string;
    description: string | null;
    systemType: string;
    riskLevel: string | null;
    status: string;
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
): {
  title: string;
  subtitle: string;
  sections: ReportSection[];
  generatedAt: string;
  reportId: string;
  locale: string;
} {
  const generatedAt = new Date().toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const baseSections: ReportSection[] = [
    {
      title: "System Information",
      items: [
        { label: "System Name", value: system.name },
        { label: "System Type", value: system.systemType },
        { label: "Risk Level", value: system.riskLevel ?? "Not classified" },
        { label: "Status", value: system.status },
        {
          label: "Created",
          value: system.createdAt.toLocaleDateString(locale),
        },
      ],
    },
  ];

  const complianceSection: ReportSection = {
    title: "EU AI Act Compliance Status",
    items: [
      { label: "Art.6 Risk Classification", value: system.art6Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art6Compliant ? "low" : "high" },
      { label: "Art.9 Risk Management", value: system.art9Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art9Compliant ? "low" : "high" },
      { label: "Art.10 Data Governance", value: system.art10Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art10Compliant ? "low" : "high" },
      { label: "Art.12 Record Keeping", value: system.art12Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art12Compliant ? "low" : "high" },
      { label: "Art.13 Transparency", value: system.art13Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art13Compliant ? "low" : "high" },
      { label: "Art.14 Human Oversight", value: system.art14Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art14Compliant ? "low" : "high" },
      { label: "Art.15 Accuracy", value: system.art15Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art15Compliant ? "low" : "high" },
      { label: "Art.17 QMS", value: system.art17Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art17Compliant ? "low" : "high" },
      { label: "Art.27 FRIA", value: system.art27Compliant ? "Compliant" : "Non-compliant", riskLevel: system.art27Compliant ? "low" : "high" },
    ],
  };

  const scanSection: ReportSection = {
    title: "Recent Scan Results",
    items:
      system.scanResults.length > 0
        ? system.scanResults.map((sr) => ({
            label: sr.scanType,
            value: `${sr.score}/100 (${sr.status})`,
            riskLevel:
              sr.status === "pass"
                ? "low"
                : sr.status === "warning"
                  ? "medium"
                  : "high",
          }))
        : [{ label: "No scans", value: "No scan results available" }],
  };

  const qmsSection: ReportSection[] = system.qms
    ? [
        {
          title: "QMS Checklist (Art.17)",
          items: [
            {
              label: "Completion Rate",
              value: `${system.qms.completionRate}%`,
            },
            { label: "Status", value: system.qms.status },
          ],
        },
      ]
    : [];

  const friaSection: ReportSection[] = system.fria
    ? [
        {
          title: "FRIA Assessment (Art.27)",
          items: [
            {
              label: "Overall Score",
              value: system.fria.overallScore
                ? `${system.fria.overallScore}/100`
                : "Not scored",
            },
            { label: "Status", value: system.fria.status },
          ],
        },
      ]
    : [];

  let sections: ReportSection[] = [...baseSections];

  switch (reportType) {
    case "compliance-summary":
      sections = [
        ...sections,
        complianceSection,
        scanSection,
        ...qmsSection,
        ...friaSection,
      ];
      break;
    case "risk-assessment":
      sections = [
        ...sections,
        {
          title: "Risk Assessment Results",
          items: [
            {
              label: "Risk Level",
              value: system.riskLevel ?? "Unknown",
              riskLevel:
                system.riskLevel === "high"
                  ? "high"
                  : system.riskLevel === "limited"
                    ? "medium"
                    : "low",
            },
            {
              label: "System Type",
              value: system.systemType,
            },
          ],
        },
        complianceSection,
      ];
      break;
    case "fria":
      sections = [
        ...sections,
        ...(friaSection.length > 0
          ? friaSection
          : [
              {
                title: "FRIA Assessment (Art.27)",
                items: [
                  {
                    label: "Status",
                    value: "No FRIA assessment found",
                  },
                ],
              },
            ]),
      ];
      break;
    case "qms":
      sections = [
        ...sections,
        ...(qmsSection.length > 0
          ? qmsSection
          : [
              {
                title: "QMS Checklist (Art.17)",
                items: [
                  {
                    label: "Status",
                    value: "No QMS checklist found",
                  },
                ],
              },
            ]),
      ];
      break;
    case "data-governance":
      sections = [
        ...sections,
        {
          title: "Data Governance (Art.10)",
          items: [
            {
              label: "Compliance Status",
              value: system.art10Compliant ? "Compliant" : "Non-compliant",
              riskLevel: system.art10Compliant ? "low" : "high",
            },
          ],
        },
      ];
      break;
  }

  return {
    title: `EU AI Act Compliance Report - ${system.name}`,
    subtitle: `${reportType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | Generated on ${generatedAt}`,
    sections,
    generatedAt,
    reportId: `RPT-${system.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
    locale,
  };
}
