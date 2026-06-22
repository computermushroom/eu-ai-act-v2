// Admin Guard Utility
// Simple admin authorization based on ADMIN_EMAILS environment variable
// Comma-separated list of admin email addresses
// Usage: const guard = await requireAdmin(request); if (guard) return guard;

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Get the list of admin email addresses from environment variable.
 * ADMIN_EMAILS should be a comma-separated string, e.g. "admin@example.com,owner@example.com"
 */
function getAdminEmails(): string[] {
  const envValue = process.env.ADMIN_EMAILS ?? "";
  return envValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if a given email address has admin privileges.
 * @param email - User email to check
 * @returns true if the email is in the admin list
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Admin authorization middleware for API routes.
 * Returns a NextResponse error if the user is not an admin, or null if authorized.
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const guard = await requireAdmin(request);
 *   if (guard) return guard;
 *   // ... proceed with admin-only logic
 * }
 * ```
 *
 * @param _request - The incoming request (reserved for future use)
 * @returns NextResponse on failure, null on success
 */
export async function requireAdmin(
  _request: NextRequest
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return null;
}
