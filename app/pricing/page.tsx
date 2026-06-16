// Pricing Page
// Server Component - displays 5 subscription tiers
// Payment checkout integration via client-side API call

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import type { SubscriptionPlan } from "@/types";

export const metadata: Metadata = {
  title: "Pricing | EU AI Act Compliance Tool",
  description:
    "Choose the right plan for your EU AI Act compliance needs. From free risk assessment to enterprise-grade compliance automation.",
};

/**
 * Pricing page with 5 subscription tiers
 */
export default async function PricingPage() {
  const t = await getTranslations();
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const PLANS: SubscriptionPlan[] = [
    {
      id: "free",
      name: t("pricing.plans.free.name"),
      price: 0,
      features: [
        t("pricing.plans.free.features.aiLiteracy"),
        t("pricing.plans.free.features.knowledgeBase"),
        t("pricing.plans.free.features.riskClassification"),
        t("pricing.plans.free.features.multilingualSupport"),
        t("pricing.plans.free.features.urlScan"),
      ],
    },
    {
      id: "starter",
      name: t("pricing.plans.starter.name"),
      price: 39,
      features: [
        t("pricing.plans.starter.features.everythingInFree"),
        t("pricing.plans.starter.features.prohibitedPractices"),
        t("pricing.plans.starter.features.transparencyObligations"),
        t("pricing.plans.starter.features.urlScan5x"),
        t("pricing.plans.starter.features.documentTemplates"),
        t("pricing.plans.starter.features.complianceScoreReport"),
        t("pricing.plans.starter.features.riskLevelDetermination"),
        t("pricing.plans.starter.features.industryTemplates"),
      ],
    },
    {
      id: "professional",
      name: t("pricing.plans.professional.name"),
      price: 89,
      features: [
        t("pricing.plans.professional.features.everythingInStarter"),
        t("pricing.plans.professional.features.riskManagement"),
        t("pricing.plans.professional.features.dataGovernance"),
        t("pricing.plans.professional.features.technicalDocumentation"),
        t("pricing.plans.professional.features.specializedChecks"),
        t("pricing.plans.professional.features.fria"),
        t("pricing.plans.professional.features.urlScan20x"),
        t("pricing.plans.professional.features.whiteLabelReports"),
        t("pricing.plans.professional.features.auditLogs"),
        t("pricing.plans.professional.features.multilingualExport"),
        t("pricing.plans.professional.features.conformityGuidance"),
      ],
    },
    {
      id: "business",
      name: t("pricing.plans.business.name"),
      price: 159,
      features: [
        t("pricing.plans.business.features.everythingInProfessional"),
        t("pricing.plans.business.features.qmsChecklist"),
        t("pricing.plans.business.features.deployerObligations"),
        t("pricing.plans.business.features.fullFria"),
        t("pricing.plans.business.features.complianceTools"),
        t("pricing.plans.business.features.autoScan"),
        t("pricing.plans.business.features.shadowAiScan"),
        t("pricing.plans.business.features.changeAlerts"),
        t("pricing.plans.business.features.roleBasedObligations"),
        t("pricing.plans.business.features.fullIndustryTemplates"),
        t("pricing.plans.business.features.auditChain"),
      ],
    },
    {
      id: "enterprise",
      name: t("pricing.plans.enterprise.name"),
      price: 249,
      features: [
        t("pricing.plans.enterprise.features.everythingInBusiness"),
        t("pricing.plans.enterprise.features.gpaiCompliance"),
        t("pricing.plans.enterprise.features.unlimitedAiSystems"),
        t("pricing.plans.enterprise.features.customChecklists"),
        t("pricing.plans.enterprise.features.regulatoryPush"),
        t("pricing.plans.enterprise.features.apiWebhooks"),
        t("pricing.plans.enterprise.features.teamCollaboration"),
        t("pricing.plans.enterprise.features.gdprIntegration"),
        t("pricing.plans.enterprise.features.documentVersioning"),
        t("pricing.plans.enterprise.features.dedicatedAdvisor"),
        t("pricing.plans.enterprise.features.whiteLabelPortal"),
        t("pricing.plans.enterprise.features.shadowAiScanFull"),
        t("pricing.plans.enterprise.features.complianceDashboard"),
        t("pricing.plans.enterprise.features.aiAssistant"),
        t("pricing.plans.enterprise.features.trainingModule"),
      ],
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("pricing.title")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
      </div>

      {/* Pricing cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} isLoggedIn={isLoggedIn} />
        ))}
      </div>

      {/* FAQ / Notes */}
      <div className="mx-auto mt-16 max-w-3xl space-y-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t("pricing.footer")}{" "}
          <Link href="/" className="text-primary hover:underline">
            {t("pricing.contactUs")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/**
 * Individual pricing card component
 */
function PricingCard({ plan, isLoggedIn }: { plan: SubscriptionPlan; isLoggedIn: boolean }) {
  const isPopular = plan.id === "professional";

  return (
    <div
      className={`relative flex flex-col rounded-lg border p-6 shadow-sm ${
        isPopular
          ? "border-primary ring-1 ring-primary"
          : "border-border"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          {plan.name}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {plan.price === 0 ? plan.name : `€${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-muted-foreground">/month</span>
          )}
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
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
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {plan.price === 0 ? (
          <Link
            href="/register"
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Get Started Free
          </Link>
        ) : isLoggedIn ? (
          <CheckoutButton tier={plan.id} isPopular={isPopular} />
        ) : (
          <Link
            href={`/register?plan=${plan.id}`}
            className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${
              isPopular
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background hover:bg-muted"
            }`}
          >
            Subscribe
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Client-side checkout button for logged-in users
 * Defaults to monthly billing cycle (no UI toggle currently present).
 */
function CheckoutButton({ tier, isPopular }: { tier: string; isPopular: boolean }) {
  "use client";

  return (
    <button
      onClick={async () => {
        try {
          const res = await fetch("/api/subscription/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tier, billingCycle: "monthly" }),
          });
          const data = await res.json();
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            alert(data.error || "Failed to create checkout");
          }
        } catch {
          alert("An error occurred. Please try again.");
        }
      }}
      className={`inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${
        isPopular
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-background hover:bg-muted"
      }`}
    >
      Subscribe
    </button>
  );
}
