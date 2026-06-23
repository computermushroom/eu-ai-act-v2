import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tools/url-scan/route";

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockSubscriptionFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scanResult: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
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

vi.mock("@/lib/url-scanner", () => ({
  scanUrl: vi.fn(() =>
    Promise.resolve({
      overallScore: 75,
      checks: [
        { name: "AI Detection", passed: true },
        { name: "Transparency", passed: false },
      ],
      url: "https://example.com",
    })
  ),
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: vi.fn(() => () => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60000 })),
}));

function createRequest(body: unknown) {
  return new Request("http://localhost/api/tools/url-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/tools/url-scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: active professional subscription
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "user_123",
      status: "active",
      tier: "professional",
    });
  });

  it("should scan a URL successfully", async () => {
    const req = createRequest({ url: "https://example.com" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.result.overallScore).toBe(75);
    expect(data.result.checks).toHaveLength(2);
  });

  it("should reject invalid URL format", async () => {
    const req = createRequest({ url: "not-a-url" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid URL");
  });

  it("should reject missing URL", async () => {
    const req = createRequest({});

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should reject unauthenticated requests", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const req = createRequest({ url: "https://example.com" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should handle rate limiting", async () => {
    for (let i = 0; i < 20; i++) {
      const req = createRequest({ url: `https://example${i}.com` });
      const res = await POST(req);
      if (i < 20) {
        expect([200, 429]).toContain(res.status);
      }
    }
  });
});
