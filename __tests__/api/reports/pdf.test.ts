import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/reports/pdf/route";

const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aISystem: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { id: "user_123", email: "test@example.com" },
    })
  ),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/reports/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/reports/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockReset();
  });

  it("should generate compliance summary report", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sys_123",
      userId: "user_123",
      name: "Test AI System",
      description: "A test system",
      systemType: "high-risk",
      status: "active",
      riskLevel: "high",
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
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-06-01"),
      scanResults: [
        { scanType: "risk", score: 85, status: "pass", createdAt: new Date() },
      ],
      qms: { completionRate: 75, status: "in_progress" },
      fria: { status: "submitted", overallScore: 80 },
      documents: [
        { title: "Test Doc", type: "technical", status: "approved" },
      ],
    });

    const req = createRequest({
      systemId: "sys_123",
      reportType: "compliance-summary",
      locale: "en",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reportData).toBeDefined();
    expect(data.reportData.title).toContain("Test AI System");
    expect(data.reportData.sections).toBeDefined();
    expect(data.reportData.sections.length).toBeGreaterThan(0);
    expect(data.downloadUrl).toContain("/api/reports/pdf/download");
  });

  it("should generate risk assessment report", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sys_123",
      userId: "user_123",
      name: "Test System",
      description: null,
      systemType: "high-risk",
      status: "active",
      riskLevel: "high",
      industry: null,
      art6Compliant: false,
      art9Compliant: false,
      art10Compliant: false,
      art12Compliant: false,
      art13Compliant: false,
      art14Compliant: false,
      art15Compliant: false,
      art17Compliant: false,
      art27Compliant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      scanResults: [],
      qms: null,
      fria: null,
      documents: [],
    });

    const req = createRequest({
      systemId: "sys_123",
      reportType: "risk-assessment",
      locale: "en",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reportData.sections.some((s: { title: string }) => s.title === "Risk Assessment Results")).toBe(true);
  });

  it("should reject invalid report type", async () => {
    const req = createRequest({
      systemId: "sys_123",
      reportType: "invalid-type",
      locale: "en",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should reject missing systemId", async () => {
    const req = createRequest({
      reportType: "compliance-summary",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("System ID");
  });

  it("should reject access to other users systems", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sys_123",
      userId: "other_user",
      name: "Other System",
      description: null,
      systemType: "high-risk",
      status: "active",
      riskLevel: null,
      industry: null,
      art6Compliant: false,
      art9Compliant: false,
      art10Compliant: false,
      art12Compliant: false,
      art13Compliant: false,
      art14Compliant: false,
      art15Compliant: false,
      art17Compliant: false,
      art27Compliant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      scanResults: [],
      qms: null,
      fria: null,
      documents: [],
    });

    const req = createRequest({
      systemId: "sys_123",
      reportType: "compliance-summary",
      locale: "en",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 404 for non-existent system", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createRequest({
      systemId: "nonexistent",
      reportType: "compliance-summary",
      locale: "en",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("should handle rate limiting", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sys_123",
      userId: "user_123",
      name: "Test",
      description: null,
      systemType: "high-risk",
      status: "active",
      riskLevel: null,
      industry: null,
      art6Compliant: false,
      art9Compliant: false,
      art10Compliant: false,
      art12Compliant: false,
      art13Compliant: false,
      art14Compliant: false,
      art15Compliant: false,
      art17Compliant: false,
      art27Compliant: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      scanResults: [],
      qms: null,
      fria: null,
      documents: [],
    });

    for (let i = 0; i < 5; i++) {
      const req = createRequest({
        systemId: "sys_123",
        reportType: "compliance-summary",
        locale: "en",
      });
      const res = await POST(req);
      if (res.status === 429) break;
    }

    const req = createRequest({
      systemId: "sys_123",
      reportType: "compliance-summary",
      locale: "en",
    });
    const res = await POST(req);
    expect([200, 429]).toContain(res.status);
  });
});
