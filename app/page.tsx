// Home Page (Landing Page)
// Server Component with next-intl translations
// Converts visitors to registered users

import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * Feature card keys mapping to translation JSON
 */
const FEATURE_KEYS = [
  { titleKey: "features.riskClassification.title", descKey: "features.riskClassification.description", href: "/tools/risk-assessment" },
  { titleKey: "features.prohibitedPractices.title", descKey: "features.prohibitedPractices.description", href: "/tools/prohibited-practices" },
  { titleKey: "features.transparency.title", descKey: "features.transparency.description", href: "/tools/transparency" },
  { titleKey: "features.documentation.title", descKey: "features.documentation.description", href: "/tools/documentation" },
  { titleKey: "features.urlScan.title", descKey: "features.urlScan.description", href: "/tools/url-scan" },
  { titleKey: "features.reports.title", descKey: "features.reports.description", href: "/dashboard" },
];

/**
 * Article card keys mapping to translation JSON
 */
const ARTICLE_KEYS = [
  { tag: "Art. 5", titleKey: "articles.prohibitedPractices.title", descKey: "articles.prohibitedPractices.description" },
  { tag: "Art. 6", titleKey: "articles.riskClassification.title", descKey: "articles.riskClassification.description" },
  { tag: "Art. 9-15", titleKey: "articles.highRisk.title", descKey: "articles.highRisk.description" },
  { tag: "Art. 50", titleKey: "articles.transparency.title", descKey: "articles.transparency.description" },
  { tag: "Art. 17", titleKey: "articles.qualityManagement.title", descKey: "articles.qualityManagement.description" },
  { tag: "Art. 27", titleKey: "articles.fria.title", descKey: "articles.fria.description" },
  { tag: "Annex IV", titleKey: "articles.technicalDocs.title", descKey: "articles.technicalDocs.description" },
  { tag: "Art. 51-56", titleKey: "articles.gpai.title", descKey: "articles.gpai.description" },
];

/**
 * Landing page - converts visitors to users
 */
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30 py-20 sm:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                {t("hero.description")}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("hero.cta")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-8 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("hero.note")}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("features.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("features.description")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map((feature) => (
              <FeatureCard
                key={feature.titleKey}
                title={t(feature.titleKey)}
                description={t(feature.descKey)}
                href={feature.href}
                learnMore={t("common.learnMore")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Articles Section */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("articles.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("articles.description")}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ARTICLE_KEYS.map((article) => (
              <ArticleCard
                key={article.tag}
                article={article.tag}
                title={t(article.titleKey)}
                description={t(article.descKey)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {t("hero.ctaTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("hero.ctaDescription")}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("hero.createAccount")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-8 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t("hero.comparePlans")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Feature card for the landing page
 */
function FeatureCard({
  title,
  description,
  href,
  learnMore,
}: {
  title: string;
  description: string;
  href: string;
  learnMore: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-border bg-background p-6 shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/50"
    >
      <h3 className="text-lg font-semibold group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">
        {learnMore}
        <svg
          className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </span>
    </Link>
  );
}

/**
 * Article coverage card
 */
function ArticleCard({
  article,
  title,
  description,
}: {
  article: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {article}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
