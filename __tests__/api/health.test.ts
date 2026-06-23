import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

const mockQueryRaw = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock("@/lib/env", () => ({
  validateEnv: vi.fn(() => ({ valid: true, missing: [], warnings: [] })),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryRaw.mockReset();
  });

  it("should return healthy status when all checks pass", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("healthy");
    expect(data.checks.env.status).toBe("healthy");
    expect(data.latencyMs).toBeGreaterThanOrEqual(0);
    expect(data.uptime).toBeGreaterThan(0);
  });

  it("should return unhealthy status when database fails", async () => {
    mockQueryRaw.mockRejectedValue(new Error("Connection refused"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("unhealthy");
  });

  it("should return unhealthy status when environment is invalid", async () => {
    const { validateEnv } = await import("@/lib/env");
    vi.mocked(validateEnv).mockReturnValueOnce({
      valid: false,
      missing: ["DATABASE_URL"],
      warnings: [],
    });
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.env.status).toBe("unhealthy");
    expect(data.checks.env.missing).toContain("DATABASE_URL");
  });

  it("should be accessible without authentication", async () => {
    mockQueryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await GET();

    expect(res.status).toBe(200);
  });
});
