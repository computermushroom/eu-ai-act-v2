// Auth Route Protection
// Server-side authentication check for protected routes
// Use in Server Components or layout.tsx to gate access

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Require authentication for a server component or route
 * Call at the top of a Server Component to redirect unauthenticated users
 * @returns The session object if authenticated
 * @throws Redirects to /login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

/**
 * Optional auth check - returns session or null
 * Does not redirect, useful for conditional rendering
 */
export async function optionalAuth() {
  const session = await auth();
  return session;
}
