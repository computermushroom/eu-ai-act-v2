// Health Check API
// GET: Returns application health status for monitoring
// Used by Vercel, load balancers, and uptime monitors

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEnv } from "@/lib/env";

/**
 * GET /api/health
 * Returns health status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now();

  // Check environment variables
  const envResult = validateEnv();

  // Check database connectivity
  let dbStatus: "healthy" | "unhealthy" = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "unhealthy";
  }

  const totalLatencyMs = Date.now() - startTime;

  const isHealthy = envResult.valid && dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "0.1.0",
      latencyMs: totalLatencyMs,
      checks: {
        env: {
          status: envResult.valid ? "healthy" : "unhealthy",
          missing: envResult.missing.length > 0 ? envResult.missing : undefined,
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Response-Time": `${totalLatencyMs}ms`,
      },
    }
  );
}
