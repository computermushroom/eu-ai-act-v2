import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuditLog, getUserAuditLogs, getRecentAuditLogs } from "@/lib/audit";

const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Mock next/headers to provide headers list for createAuditLog
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

describe("Audit Log Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockFindMany.mockReset();
    mockCount.mockReset();
  });

  describe("createAuditLog", () => {
    it("should create an audit log entry", async () => {
      mockCreate.mockResolvedValue({
        id: "log_123",
        userId: "user_123",
        action: "user_login",
        resource: "auth",
        details: '{"ip":"127.0.0.1"}',
        createdAt: new Date(),
      });

      const result = await createAuditLog({
        userId: "user_123",
        action: "user_login",
        resource: "auth",
        details: { ip: "127.0.0.1" },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_123",
          action: "user_login",
          resource: "auth",
          details: '{"ip":"127.0.0.1"}',
          ipAddress: "127.0.0.0", // hashed by hashIp: removes last octet
          userAgent: "test-agent",
        }),
      });
      expect(result).toBeUndefined();
    });

    it("should handle missing userId gracefully", async () => {
      mockCreate.mockResolvedValue({
        id: "log_456",
        userId: null,
        action: "user_login",
        resource: "health",
        details: null,
        createdAt: new Date(),
      });

      const result = await createAuditLog({
        action: "user_login",
        resource: "health",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: undefined,
          action: "user_login",
          resource: "health",
          details: undefined,
        }),
      });
      expect(result).toBeUndefined();
    });

    it("should not throw on database error", async () => {
      mockCreate.mockRejectedValue(new Error("DB connection failed"));

      // Should not throw
      await expect(
        createAuditLog({
          userId: "user_123",
          action: "user_login",
          resource: "auth",
        })
      ).resolves.toBeUndefined();
    });
  });

  describe("getUserAuditLogs", () => {
    it("should retrieve paginated audit logs for a user", async () => {
      const mockLogs = [
        { id: "log_1", action: "user_login", createdAt: new Date() },
        { id: "log_2", action: "tool_risk_assessment", createdAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(2);

      const result = await getUserAuditLogs("user_123", 10, 0);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_123" },
          orderBy: { createdAt: "desc" },
          take: 10,
          skip: 0,
        })
      );
      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should calculate total pages correctly", async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(25);

      const result = await getUserAuditLogs("user_123", 10, 0);

      expect(Math.ceil(result.total / 10)).toBe(3);
    });

    it("should throw on database error", async () => {
      mockFindMany.mockRejectedValue(new Error("DB connection failed"));

      // getUserAuditLogs does not have try/catch, so it should throw
      await expect(getUserAuditLogs("user_123", 10, 0)).rejects.toThrow("DB connection failed");
    });
  });

  describe("getRecentAuditLogs", () => {
    it("should retrieve recent audit logs with limit", async () => {
      const mockLogs = [
        { id: "log_1", action: "user_login", createdAt: new Date() },
        { id: "log_2", action: "tool_risk_assessment", createdAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(mockLogs);

      const result = await getRecentAuditLogs(2);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
          take: 2,
        })
      );
      expect(result).toHaveLength(2);
    });

    it("should throw on database error", async () => {
      mockFindMany.mockRejectedValue(new Error("DB connection failed"));

      // getRecentAuditLogs does not have try/catch, so it should throw
      await expect(getRecentAuditLogs(5)).rejects.toThrow("DB connection failed");
    });
  });
});
