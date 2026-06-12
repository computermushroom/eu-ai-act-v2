// Header Navigation Component
// Client Component: needs session state from NextAuth + useTranslations
// Contains: Logo, Navigation links, Auth state, Language switcher

"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

/**
 * Main site header with navigation
 * Displays on all pages except auth pages (handled by route groups)
 */
export default function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label={t("nav.home")}>
          <Image
            src="/logo.svg"
            alt="EU AI Act Compliance Tool"
            width={32}
            height={32}
            priority
          />
          <span className="hidden text-lg font-semibold sm:inline">
            AI Act Compliance
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <NavLink href="/">{t("nav.home")}</NavLink>
          <NavLink href="/tools/risk-assessment">{t("nav.tools")}</NavLink>
          {isAuthenticated && <NavLink href="/dashboard">{t("nav.dashboard")}</NavLink>}
          <NavLink href="/pricing">{t("nav.pricing")}</NavLink>
        </nav>

        {/* Right side: Auth buttons + Language */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <LanguageSwitcher />

          <div className="flex items-center gap-2">
            {isLoading ? (
              // Loading skeleton
              <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
            ) : isAuthenticated ? (
              // Authenticated: show user name + logout
              <>
                <Link
                  href="/dashboard/settings"
                  className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
                >
                  {session?.user?.name ?? session?.user?.email ?? t("nav.settings")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              // Not authenticated: show login + register
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Individual navigation link with active state styling
 */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
