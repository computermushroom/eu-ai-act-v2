// Dashboard Page
// Client Component: user overview, subscription status, tool access, recent activity
// Fetches real dashboard data from /api/dashboard and profile from /api/profile

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SubscriptionTier } from "@/types";

/**
 * Dashboard stat card data
 */
interface StatCard {
  label: string;
  value: string;
  description: string;
  href?: string;
}

/**
 * Available tool cards for the dashboard
 */
interface ToolCard {
  title: string;
  description: string;
  href: string;
  tier: SubscriptionTier;
  articleRef: string;
}

/**
 * User profile data from API
 */
interface UserProfile {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: string;
    subscription: {
      status: string;
      tier: SubscriptionTier;
      currentPeriodEnd: string | null;
    } | null;
  };
}

/**
 * Recent activity item
 */
interface RecentActivity {
  id: string;
  action: string;
  resource: string | null;
  createdAt: string;
}

/**
 * Dashboard API response
 */
interface DashboardData {
  totalAssessments: number;
  complianceScore: number;
  reportsGenerated: number;
  urlScansRemaining: number | null;
  recentActivity: RecentActivity[];
  aiSystemsCount: number;
  alertsCount: number;
  tier: SubscriptionTier;
}

/**
 * Dashboard page - user overview and tool access
 */
export default function DashboardPage() {
  const t = useTranslations();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, dashboardRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/dashboard"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboard(dashboardData);
      }
    } catch (error) {
      console.error("[DASHBOARD] Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentTier: SubscriptionTier =
    profile?.user?.subscription?.tier ?? "free";

  const TOOLS: ToolCard[] = [
    {
      title: t("dashboard.tools.riskClassification.title"),
      description: t("dashboard.tools.riskClassification.description"),
      href: "/tools/risk-assessment",
      tier: "free",
      articleRef: "Art.6",
    },
    {
      title: t("dashboard.tools.prohibitedPractices.title"),
      description: t("dashboard.tools.prohibitedPractices.description"),
      href: "/tools/prohibited-practices",
      tier: "starter",
      articleRef: "Art.5",
    },
    {
      title: t("dashboard.tools.transparencyCheck.title"),
      description: t("dashboard.tools.transparencyCheck.description"),
      href: "/tools/transparency",
      tier: "starter",
      articleRef: "Art.50",
    },
    {
      title: t("dashboard.tools.urlComplianceScan.title"),
      description: t("dashboard.tools.urlComplianceScan.description"),
      href: "/tools/url-scan",
      tier: "free",
      articleRef: "General",
    },
  ];

  const NAV_TOOLS: ToolCard[] = [
    {
      title: t("dashboard.tools.aiSystems.title"),
      description: t("dashboard.tools.aiSystems.description"),
      href: "/dashboard/ai-systems",
      tier: "free",
      articleRef: "Art.9-15",
    },
    {
      title: t("dashboard.tools.shadowAi.title"),
      description: t("dashboard.tools.shadowAi.description"),
      href: "/tools/shadow-ai",
      tier: "starter",
      articleRef: "Art.5",
    },
    {
      title: t("dashboard.tools.fria.title"),
      description: t("dashboard.tools.fria.description"),
      href: "/tools/fria",
      tier: "professional",
      articleRef: "Art.27",
    },
    {
      title: t("dashboard.tools.qms.title"),
      description: t("dashboard.tools.qms.description"),
      href: "/tools/qms",
      tier: "professional",
      articleRef: "Art.17",
    },
    {
      title: t("dashboard.tools.scanTasks.title"),
      description: t("dashboard.tools.scanTasks.description"),
      href: "/dashboard/scan-tasks",
      tier: "business",
      articleRef: "Art.12",
    },
  ];

  const stats: StatCard[] = [
    {
      label: t("dashboard.assessments"),
      value: isLoading ? "--" : String(dashboard?.totalAssessments ?? 0),
      description: t("dashboard.completedThisMonth"),
    },
    {
      label: t("dashboard.complianceScore"),
      value: isLoading
        ? "--"
        : dashboard?.complianceScore != null
          ? `${dashboard.complianceScore}%`
          : "0%",
      description: t("dashboard.averageAcrossSystems"),
    },
    {
      label: t("dashboard.reports"),
      value: isLoading ? "--" : String(dashboard?.reportsGenerated ?? 0),
      description: t("dashboard.generatedThisMonth"),
    },
    {
      label: t("dashboard.urlScans"),
      value: isLoading
        ? "--"
        : dashboard?.urlScansRemaining === null
          ? t("dashboard.unlimited")
          : String(dashboard?.urlScansRemaining ?? 0),
      description: t("dashboard.remainingThisMonth"),
    },
  ];

  const tierLabel: Record<SubscriptionTier, string> = {
    free: t("tiers.free"),
    starter: t("tiers.starter"),
    professional: t("tiers.professional"),
    business: t("tiers.business"),
    enterprise: t("tiers.enterprise"),
  };

  const tierColor: Record<SubscriptionTier, string> = {
    free: "bg-muted text-muted-foreground",
    starter: "bg-primary/10 text-primary",
    professional: "bg-accent/10 text-accent",
    business: "bg-orange-500/10 text-orange-600",
    enterprise: "bg-purple-500/10 text-purple-600",
  };

  const formatAction = (action: string) => {
    return action
      .replace(/^tool_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? t("common.loading")
              : profile?.user?.name
                ? `${t("dashboard.welcomeBack")}, ${profile.user.name}`
                : t("dashboard.overview")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tierColor[currentTier]}`}
          >
            {tierLabel[currentTier]} {t("dashboard.plan")}
          </span>
          <Link
            href="/pricing"
            className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            {t("dashboard.upgrade")}
          </Link>
        </div>
      </div>

      {/* Compliance Score Visualization */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Score Gauge */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="text-sm font-semibold">{t("dashboard.complianceScore")}</h3>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/20" />
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${((dashboard?.complianceScore ?? 0) / 100) * 440} 440`}
                  className={
                    (dashboard?.complianceScore ?? 0) >= 80
                      ? "stroke-accent"
                      : (dashboard?.complianceScore ?? 0) >= 50
                      ? "stroke-orange-500"
                      : "stroke-red-500"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${
                  (dashboard?.complianceScore ?? 0) >= 80
                    ? "text-accent"
                    : (dashboard?.complianceScore ?? 0) >= 50
                    ? "text-orange-600"
                    : "text-red-600"
                }`}>
                  {isLoading ? "--" : dashboard?.complianceScore ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">{t("dashboard.overallScore")}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-lg font-bold">{isLoading ? "--" : dashboard?.aiSystemsCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">{t("dashboard.aiSystems")}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-lg font-bold">{isLoading ? "--" : dashboard?.totalAssessments ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">{t("dashboard.assessments")}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-lg font-bold">{isLoading ? "--" : dashboard?.reportsGenerated ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">{t("dashboard.reports")}</p>
            </div>
          </div>
        </div>

        {/* Monthly Activity Bar Chart (SVG) */}
        <div className="rounded-lg border border-border bg-background p-6">
          <h3 className="text-sm font-semibold">{t("dashboard.monthlyActivity")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.assessmentsAndReportsThisMonth")}</p>
          <div className="mt-4 flex h-40 items-end justify-around gap-3">
            {[
              { label: t("dashboard.assessments"), value: dashboard?.totalAssessments ?? 0, color: "bg-primary" },
              { label: t("dashboard.reports"), value: dashboard?.reportsGenerated ?? 0, color: "bg-accent" },
              { label: t("dashboard.aiSystems"), value: dashboard?.aiSystemsCount ?? 0, color: "bg-orange-500" },
              { label: t("dashboard.alerts"), value: dashboard?.alertsCount ?? 0, color: "bg-red-500" },
            ].map((bar) => {
              const height = Math.max((bar.value / 10) * 100, 4);
              return (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium">{bar.value}</span>
                  <div className="w-full max-w-[48px] rounded-t-md bg-muted/20" style={{ height: "100px" }}>
                    <div
                      className={`w-full rounded-t-md ${bar.color} transition-all duration-500`}
                      style={{ height: `${Math.min(height, 100)}%`, marginTop: `${100 - Math.min(height, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{bar.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("dashboard.urlScansLeft")}: <strong>{isLoading ? "--" : dashboard?.urlScansRemaining === null ? t("dashboard.unlimited") : dashboard?.urlScansRemaining}</strong></span>
            <span>{t("dashboard.tier")}: <strong>{tierLabel[currentTier]}</strong></span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-background p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/ai-systems"
          className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30"
        >
          <div>
            <p className="text-sm text-muted-foreground">{t("dashboard.aiSystems")}</p>
            <p className="text-xl font-bold">
              {isLoading ? "--" : dashboard?.aiSystemsCount ?? 0}
            </p>
          </div>
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
            />
          </svg>
        </Link>
        <Link
          href="/dashboard/alerts"
          className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/30"
        >
          <div>
            <p className="text-sm text-muted-foreground">{t("dashboard.alerts")}</p>
            <p className="text-xl font-bold">
              {isLoading ? "--" : dashboard?.alertsCount ?? 0}
            </p>
          </div>
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </Link>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("dashboard.plan")}</p>
            <p className="text-xl font-bold">{tierLabel[currentTier]}</p>
          </div>
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
      </div>

      {/* One-Click Compliance Generator CTA */}
      <div className="mt-8 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{t("dashboard.oneClickGenerator")}</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{t("dashboard.auto")}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.oneClickGeneratorDescription")}
            </p>
          </div>
          <Link
            href="/tools/compliance-generator"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            {t("dashboard.generateAllDocuments")}
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Tools Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">{t("dashboard.complianceTools")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.complianceToolsDescription")}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <ToolAccessCard
              key={tool.title}
              tool={tool}
              currentTier={currentTier}
            />
          ))}
        </div>
      </div>

      {/* Navigation Tools Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">{t("dashboard.managementTools")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.managementToolsDescription")}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_TOOLS.map((tool) => (
            <ToolAccessCard
              key={tool.title}
              tool={tool}
              currentTier={currentTier}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
        <div className="mt-4 rounded-lg border border-border bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <ul className="divide-y divide-border">
              {dashboard.recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {formatAction(activity.action)}
                      </p>
                      {activity.resource && (
                        <p className="text-xs text-muted-foreground">
                          {activity.resource}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noRecentActivity")}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">{t("dashboard.quickActions")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/tools/risk-assessment"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("dashboard.newRiskAssessment")}
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("dashboard.accountSettings")}
          </Link>
          <Link
            href="/privacy#data-rights"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("dashboard.exportMyData")}
          </Link>
          <Link
            href="/dashboard/audit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("dashboard.activityLog")}
          </Link>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="mt-10 rounded-lg border border-border bg-muted/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("dashboard.subscription")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.currentPlan")} {tierLabel[currentTier]}
              {profile?.user?.subscription?.currentPeriodEnd && (
                <span className="ml-1">
                  ({t("dashboard.renews")}{" "}
                  {new Date(
                    profile.user.subscription.currentPeriodEnd
                  ).toLocaleDateString()}
                  )
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("dashboard.upgradePlan")}
            </Link>
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t("dashboard.manageSubscription")}
            </Link>
          </div>
        </div>

        {/* Feature list for current tier */}
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t("dashboard.features.aiLiteracy")}
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t("dashboard.features.knowledgeBase")}
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t("dashboard.features.riskClassification")}
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {t("dashboard.features.urlScan")}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tool access card with tier lock indicator
 */
function ToolAccessCard({
  tool,
  currentTier,
}: {
  tool: ToolCard;
  currentTier: SubscriptionTier;
}) {
  const t = useTranslations();

  const tierOrder: SubscriptionTier[] = [
    "free",
    "starter",
    "professional",
    "business",
    "enterprise",
  ];

  const isLocked =
    tierOrder.indexOf(currentTier) < tierOrder.indexOf(tool.tier);

  return (
    <div
      className={`flex flex-col rounded-lg border p-5 ${
        isLocked
          ? "border-border bg-muted/30 opacity-60"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          {tool.articleRef}
        </span>
        {isLocked && (
          <span className="text-xs text-muted-foreground">{tool.tier}+</span>
        )}
      </div>
      <h3 className="mt-2 text-sm font-semibold">{tool.title}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">
        {tool.description}
      </p>
      {isLocked ? (
        <Link
          href="/pricing"
          className="mt-4 inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
        >
          {t("dashboard.unlock")}
        </Link>
      ) : (
        <Link
          href={tool.href}
          className="mt-4 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("dashboard.openTool")}
        </Link>
      )}
    </div>
  );
}
