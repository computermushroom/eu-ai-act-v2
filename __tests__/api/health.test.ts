import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

const mockQueryRaw = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock("@/lib/env", () => ({
  validateEnv: vi.fn(() => ({ missing: [], invalid: [] })),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryRaw.mockReset();
  });

  it("should return healthy status when all checks pass", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const req = new Request("http://localhost/api/health") as unknown as import("next/server").NextRequest;
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.database).toBe("connected");
    expect(data.environment).toBe("valid");
    expect(data.latency).toBeGreaterThanOrEqual(0);
    expect(data.uptime).toBeGreaterThan(0);
  });

  it("should return degraded status when database fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));

    const req = new Request("http://localhost/api/health") as unknown as import("next/server").NextRequest;
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.database).toBe("disconnected");
    expect(data.error).toContain("Connection refused");
  });

  it("should return degraded status when environment is invalid", async () => {
    const { validateEnv } = await import("@/lib/env");
    vi.mocked(validateEnv).mockReturnValueOnce({
      missing: ["DATABASE_URL"],
      invalid: [],
    });
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const req = new Request("http://localhost/api/health") as unknown as import("next/server").NextRequest;
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.environment).toBe("invalid");
    expect(data.missingEnvVars).toContain("DATABASE_URL");
  });

  it("should be accessible without authentication", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const req = new Request("http://localhost/api/health") as unknown as import("next/server").NextRequest;
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
