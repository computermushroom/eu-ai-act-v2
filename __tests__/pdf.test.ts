import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as pdfGenerateHandler } from "@/app/api/reports/pdf/route";

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockAISystemFindUnique = vi.fn();
const mockAuditLogCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aISystem: {
      findUnique: (...args: unknown[]) => mockAISystemFindUnique(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

// ─── Mock Auth ─────────────────────────────────────────────────────
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// ─── Mock Audit ────────────────────────────────────────────────────
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

// ─── Mock next/headers ─────────────────────────────────────────────
vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve(
      new Headers({
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "test-agent",
      })
    )
  ),
}));

// ─── Mock Rate Limiter ─────────────────────────────────────────────
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 })),
}));

// ─── Mock Subscription Guard ───────────────────────────────────────
vi.mock("@/lib/subscription-guard", () => ({
  requireTier: () => () => Promise.resolve(null),
}));

// ─── Mock @react-pdf/renderer ──────────────────────────────────────
const mockPdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(() => ({
    toBuffer: () => Promise.resolve(mockPdfBuffer),
  })),
}));

vi.mock("@/components/tools/ComplianceReportPDF", () => ({
  ComplianceReportDocument: vi.fn(() => null),
}));

describe("PDF API - Generate Report Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSystem = {
    id: "sys-123",
    name: "Test AI System",
    description: "A test system for compliance",
    systemType: "computer-vision",
    riskLevel: "high",
    status: "active",
    industry: "healthcare",
    art6Compliant: true,
    art9Compliant: false,
    art10Compliant: true,
    art12Compliant: false,
    art13Compliant: true,
    art14Compliant: false,
    art15Compliant: true,
    art17Compliant: false,
    art27Compliant: true,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-06-01"),
    userId: "user-123",
    scanResults: [
      { scanType: "risk-assessment", score: 85, status: "pass", createdAt: new Date("2026-05-01") },
      { scanType: "url-scan", score: 72, status: "warning", createdAt: new Date("2026-05-15") },
    ],
    qms: { completionRate: 65, status: "in_progress" },
    fria: { status: "completed", overallScore: 88 },
    documents: [
      { title: "Technical Doc", type: "technical", status: "approved" },
      { title: "Risk Assessment", type: "risk", status: "draft" },
    ],
  };

  it("should generate report data for compliance-summary", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue(mockSystem);

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({
        systemId: "sys-123",
        reportType: "compliance-summary",
        locale: "en",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.reportData).toBeDefined();
    expect(body.reportData.title).toContain("Test AI System");
    expect(body.reportData.sections).toBeDefined();
    expect(body.downloadUrl).toContain("/api/reports/pdf/download");
  });

  it("should generate risk-assessment report with filtered sections", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue(mockSystem);

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({
        systemId: "sys-123",
        reportType: "risk-assessment",
        locale: "en",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reportData.sections.some((s: { title: string }) => s.title === "Risk Assessment Results")).toBe(true);
  });

  it("should reject unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({ systemId: "sys-123", reportType: "compliance-summary" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should reject access to other user's system", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-456" } });
    mockAISystemFindUnique.mockResolvedValue({
      ...mockSystem,
      userId: "user-123",
    });

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({ systemId: "sys-123", reportType: "compliance-summary" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should return 404 for non-existent system", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({ systemId: "non-existent", reportType: "compliance-summary" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain("not found");
  });

  it("should reject invalid report type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const req = new NextRequest("http://localhost/api/reports/pdf", {
      method: "POST",
      body: JSON.stringify({ systemId: "sys-123", reportType: "invalid-type" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await pdfGenerateHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });
});
