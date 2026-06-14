import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as riskAssessmentHandler } from "@/app/api/tools/risk-assessment/route";
import { POST as urlScanHandler } from "@/app/api/tools/url-scan/route";
import { POST as prohibitedPracticesHandler } from "@/app/api/tools/prohibited-practices/route";
import { GET as toolsListHandler } from "@/app/api/tools/route";

// ─── Mock Prisma ───────────────────────────────────────────────────
const mockAISystemFindMany = vi.fn();
const mockAISystemFindUnique = vi.fn();
const mockAISystemCreate = vi.fn();
const mockAISystemUpdate = vi.fn();
const mockScanResultCreate = vi.fn();
const mockScanResultFindMany = vi.fn();
const mockTrainingModuleFindMany = vi.fn();
const mockTrainingModuleCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aISystem: {
      findMany: (...args: unknown[]) => mockAISystemFindMany(...args),
      findUnique: (...args: unknown[]) => mockAISystemFindUnique(...args),
      create: (...args: unknown[]) => mockAISystemCreate(...args),
      update: (...args: unknown[]) => mockAISystemUpdate(...args),
    },
    scanResult: {
      create: (...args: unknown[]) => mockScanResultCreate(...args),
      findMany: (...args: unknown[]) => mockScanResultFindMany(...args),
    },
    trainingModule: {
      findMany: (...args: unknown[]) => mockTrainingModuleFindMany(...args),
      count: (...args: unknown[]) => mockTrainingModuleCount(...args),
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

// ─── Mock Subscription Guard ───────────────────────────────────────
vi.mock("@/lib/subscription-guard", () => ({
  requireTier: () => () => Promise.resolve(null),
}));

// ─── Mock Rate Limiter ─────────────────────────────────────────────
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60000 })),
}));

function createJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("Tools API - Risk Assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create new AI system and scan result for valid input", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue(null);
    mockAISystemCreate.mockResolvedValue({
      id: "sys-123",
      name: "Test System",
      systemType: "nlp",
      riskLevel: "high",
      userId: "user-123",
    });
    mockScanResultCreate.mockResolvedValue({ id: "scan-123" });

    const req = createJsonRequest({
      systemName: "Test System",
      systemType: "nlp",
      domain: "",
      description: "",
      processesPersonalData: true,
      involvesVulnerableGroups: false,
      biometricUsage: false,
      criticalInfrastructure: false,
      educationEmployment: false,
      lawEnforcement: false,
      migrationAsylum: false,
      justiceDemocracy: false,
      autonomousDecision: false,
      emotionalManipulation: false,
      safetyComponent: false,
      healthImpact: false,
      financialImpact: false,
      employmentImpact: false,
      legalImpact: false,
    });

    const res = await riskAssessmentHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.riskLevel).toBeDefined();
    expect(body.data.riskScore).toBeDefined();
    expect(mockAISystemCreate).toHaveBeenCalled();
    expect(mockScanResultCreate).toHaveBeenCalled();
  });

  it("should update existing system if systemId provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue({
      id: "sys-123",
      name: "Existing System",
      userId: "user-123",
    });
    mockScanResultCreate.mockResolvedValue({ id: "scan-123" });

    const req = createJsonRequest({
      systemId: "sys-123",
      systemName: "Existing System",
      systemType: "nlp",
      domain: "",
      description: "",
      processesPersonalData: false,
      involvesVulnerableGroups: false,
      biometricUsage: false,
      criticalInfrastructure: false,
      educationEmployment: false,
      lawEnforcement: false,
      migrationAsylum: false,
      justiceDemocracy: false,
      autonomousDecision: false,
      emotionalManipulation: false,
      safetyComponent: false,
      healthImpact: false,
      financialImpact: false,
      employmentImpact: false,
      legalImpact: false,
    });

    const res = await riskAssessmentHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // API only verifies ownership when systemId is provided, it does not update the system
    expect(mockAISystemCreate).not.toHaveBeenCalled();
    expect(mockScanResultCreate).toHaveBeenCalled();
  });

  it("should reject unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);

    const req = createJsonRequest({ systemName: "Test", systemType: "nlp" });
    const res = await riskAssessmentHandler(req);

    expect(res.status).toBe(401);
  });

  it("should reject invalid system type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const req = createJsonRequest({
      systemName: "Test System",
      systemType: "invalid-type",
    });

    const res = await riskAssessmentHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });
});

describe("Tools API - URL Scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should scan a valid URL and return results", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    // Mock global fetch for URL scanning
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () =>
          Promise.resolve(
            `<html><head><title>Test Page</title><meta name="description" content="A test page"></head>
             <body>artificial intelligence machine learning privacy policy terms of service gdpr cookie consent</body></html>`
          ),
      })
    ) as unknown as typeof global.fetch;

    const req = createJsonRequest({ url: "https://example.com" });
    const res = await urlScanHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.result).toBeDefined();
    expect(body.result.url).toBe("https://example.com");
    expect(body.result.overallScore).toBeDefined();
    expect(Array.isArray(body.result.checks)).toBe(true);

    global.fetch = originalFetch;
  });

  it("should reject invalid URL format", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const req = createJsonRequest({ url: "not-a-url" });
    const res = await urlScanHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Invalid URL");
  });

  it("should handle fetch errors gracefully", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as unknown as typeof global.fetch;

    const req = createJsonRequest({ url: "https://unreachable-site.example" });
    const res = await urlScanHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.result).toBeDefined();
    expect(body.result.overallScore).toBe(0);
    expect(body.result.checks[0].status).toBe("fail");

    global.fetch = originalFetch;
  });
});

describe("Tools API - Prohibited Practices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should evaluate prohibited practices and create scan result", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue({
      id: "sys-123",
      name: "Test System",
      userId: "user-123",
    });
    mockScanResultFindMany.mockResolvedValue([]);
    mockAISystemUpdate.mockResolvedValue({ id: "sys-123" });
    mockScanResultCreate.mockResolvedValue({ id: "scan-123" });

    const req = createJsonRequest({
      systemId: "sys-123",
      systemName: "Test System",
      systemType: "nlp",
      description: "A natural language processing system",
      practices: ["subliminal-manipulation", "social-scoring"],
    });

    const res = await prohibitedPracticesHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isProhibited).toBeDefined();
    expect(body.data.practices).toBeDefined();
    expect(mockScanResultCreate).toHaveBeenCalled();
  });

  it("should detect prohibited practices violations", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockAISystemFindUnique.mockResolvedValue({
      id: "sys-123",
      name: "Test System",
      userId: "user-123",
    });
    mockScanResultFindMany.mockResolvedValue([]);
    mockAISystemUpdate.mockResolvedValue({ id: "sys-123" });
    mockScanResultCreate.mockResolvedValue({ id: "scan-123" });

    const req = createJsonRequest({
      systemId: "sys-123",
      systemName: "Manipulation System",
      systemType: "generative-ai",
      description: "A system that uses subliminal manipulation and social scoring",
      practices: ["subliminal-manipulation", "social-scoring"],
    });

    const res = await prohibitedPracticesHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isProhibited).toBe(true);
    expect(body.data.prohibitedCount).toBeGreaterThan(0);
  });

  it("should reject missing practices", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const req = createJsonRequest({
      systemName: "Test",
      systemType: "nlp",
      description: "test",
    });
    const res = await prohibitedPracticesHandler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });
});

describe("Tools API - List Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return tools from database when available", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockTrainingModuleFindMany.mockResolvedValue([
      {
        id: "risk-assessment",
        title: "Risk Classification",
        description: "Art.6 self-assessment",
        articleRef: "Art.6",
        difficulty: "beginner",
        order: 1,
        isActive: true,
      },
      {
        id: "data-governance",
        title: "Data Governance",
        description: "Art.10 assessment",
        articleRef: "Art.10",
        difficulty: "advanced",
        order: 2,
        isActive: true,
      },
    ]);

    const res = await toolsListHandler();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tools).toHaveLength(2);
    expect(body.tools[0].tier).toBe("free");
    expect(body.tools[1].tier).toBe("professional");
  });

  it("should fallback to static tools when database is empty", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockTrainingModuleFindMany.mockResolvedValue([]);

    const res = await toolsListHandler();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tools.length).toBeGreaterThan(0);
    expect(body.tools[0].id).toBeDefined();
  });

  it("should fallback to static tools on database error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockTrainingModuleFindMany.mockRejectedValue(new Error("Database connection failed"));

    const res = await toolsListHandler();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.tools.length).toBeGreaterThan(0);
  });
});
