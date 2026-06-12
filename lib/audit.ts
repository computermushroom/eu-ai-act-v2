// Audit Logging Service
// Centralized audit log creation for GDPR compliance and security tracking
// All significant user actions should be logged through this service

import { headers } from "next/headers";
import { prisma } from "./prisma";
import type { AuditAction } from "@prisma/client";

/**
 * Audit log input parameters
 */
interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resource?: string;
  details?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 * Safe to call from Server Components and API routes
 * @param input - Audit log data
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? undefined;
    // Hash IP for GDPR privacy (simple truncation approach)
    const rawIp = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
    const ipAddress = rawIp !== "unknown" ? hashIp(rawIp.split(",")[0]?.trim() ?? rawIp) : undefined;

    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        details: input.details ? JSON.stringify(input.details) : undefined,
        ipAddress,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[AUDIT] Failed to create audit log:", error);
  }
}

/**
 * Hash IP address for GDPR compliance
 * Uses a simple hash to anonymize while keeping rough geo capability
 */
function hashIp(ip: string): string {
  // Simple anonymization: remove last octet for IPv4, last segment for IPv6
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}:0:0:0`;
  }
  return ip;
}

/**
 * Query audit logs for a user
 * @param userId - User ID to filter by
 * @param limit - Maximum number of records
 * @param offset - Pagination offset
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 50,
  offset = 0
) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: { userId } }),
  ]);

  return { logs, total };
}

/**
 * Query recent audit logs (admin scope)
 * @param limit - Maximum number of records
 * @param action - Optional action filter
 */
export async function getRecentAuditLogs(
  limit = 100,
  action?: AuditAction
) {
  return prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  });
}
