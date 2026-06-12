// Dashboard Layout
// Server Component: protects all /dashboard/* routes with authentication
// Redirects unauthenticated users to /login

import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Double-check session validity
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <>{children}</>;
}
