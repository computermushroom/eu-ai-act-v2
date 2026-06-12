// Art.5 Prohibited AI Practices Check
// Client Component: 8-point checklist for Art.5 compliance
// Starter tier feature (€39/month)

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

/**
 * Individual prohibited practice check item
 */
interface CheckItem {
  id: string;
  title: string;
  description: string;
  articleRef: string;
  severity: "prohibited" | "restricted";
}

/**
 * Art.5 prohibited practices checklist
 * 8 items covering all prohibited and restricted AI practices
 */
const CHECK_ITEMS: CheckItem[] = [
  {
    id: "subliminal",
    title: "Subliminal Techniques",
    description:
      "AI systems that deploy subliminal techniques beyond consciousness to materially distort behavior, causing significant harm.",
    articleRef: "Art.5(1)(a)",
    severity: "prohibited",
  },
  {
    id: "vulnerable",
    title: "Exploitation of Vulnerable Groups",
    description:
      "AI systems exploiting vulnerabilities of specific groups (age, disability, social/economic situation) to distort behavior causing harm.",
    articleRef: "Art.5(1)(b)",
    severity: "prohibited",
  },
  {
    id: "social_scoring",
    title: "Social Scoring by Public Authorities",
    description:
      "AI systems for social scoring by public authorities over multiple unrelated contexts or leading to disproportionate treatment.",
    articleRef: "Art.5(1)(c)",
    severity: "prohibited",
  },
  {
    id: "biometric_realtime",
    title: "Real-time Remote Biometric ID in Public Spaces",
    description:
      "Real-time remote biometric identification in publicly accessible spaces for law enforcement purposes (with limited exceptions).",
    articleRef: "Art.5(1)(d)",
    severity: "prohibited",
  },
  {
    id: "emotion_workplace",
    title: "Emotion Recognition in Workplace/Education",
    description:
      "AI systems for emotion recognition in workplace and education institutions (with medical/safety exceptions).",
    articleRef: "Art.5(1)(b) / Art.52(3)",
    severity: "restricted",
  },
  {
    id: "biometric_categorization",
    title: "Biometric Categorization by Sensitive Attributes",
    description:
      "AI systems categorizing individuals based on biometric data to deduce/detect sensitive attributes (race, political opinions, etc.).",
    articleRef: "Art.5(1)(d)",
    severity: "prohibited",
  },
  {
    id: "untargeted_scrapping",
    title: "Untargeted Facial Image Scraping",
    description:
      "AI systems scraping facial images from the internet or CCTV footage to create or expand facial recognition databases.",
    articleRef: "Art.5(1)(d)",
    severity: "prohibited",
  },
  {
    id: "predictive_policing",
    title: "Predictive Policing Based on Profiling",
    description:
      "AI systems assessing risk of natural persons committing criminal offenses based solely on profiling or personality traits.",
    articleRef: "Art.5(1)(d)",
    severity: "prohibited",
  },
];

/**
 * Art.5 Prohibited AI Practices Check Tool
 */
export default function ProhibitedPracticesPage() {
  const t = useTranslations();

  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = useCallback((itemId: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    if (showResults) setShowResults(false);
  }, [showResults]);

  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const allAnswered = answeredCount === CHECK_ITEMS.length;

  const prohibitedCount = CHECK_ITEMS.filter(
    (item) => item.severity === "prohibited" && answers[item.id] === true
  ).length;

  const restrictedCount = CHECK_ITEMS.filter(
    (item) => item.severity === "restricted" && answers[item.id] === true
  ).length;

  const handleSubmit = useCallback(() => {
    if (!allAnswered) return;
    setShowResults(true);
  }, [allAnswered]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setShowResults(false);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Art. 5
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Prohibited AI Practices Check</h1>
        <p className="text-muted-foreground">
          Verify your AI system against Article 5 prohibited practices. This
          8-point checklist identifies whether your system falls under
          prohibited or restricted categories under the EU AI Act.
        </p>
      </div>

      {/* Progress */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("tools.results")} {answeredCount} / {CHECK_ITEMS.length}
          </span>
          {allAnswered && (
            <span className="text-accent">{t("tools.results")}</span>
          )}
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{
              width: `${(answeredCount / CHECK_ITEMS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span className="text-muted-foreground">{t("tools.nonCompliant")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground">{t("tools.partiallyCompliant")}</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-6 space-y-4">
        {CHECK_ITEMS.map((item, index) => (
          <CheckCard
            key={item.id}
            index={index + 1}
            item={item}
            answer={answers[item.id] ?? null}
            onAnswer={handleAnswer}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >{t("tools.results")}        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
        >{t("common.reset")}        </button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">{t("tools.results")}</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground">{t("tools.nonCompliant")}              </p>
              <p className="text-3xl font-bold text-destructive">
                {prohibitedCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                out of{" "}
                {CHECK_ITEMS.filter((i) => i.severity === "prohibited").length}{" "}
                items
              </p>
            </div>
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-4">
              <p className="text-sm text-muted-foreground">{t("tools.partiallyCompliant")}              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {restrictedCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                out of{" "}
                {CHECK_ITEMS.filter((i) => i.severity === "restricted").length}{" "}
                items
              </p>
            </div>
          </div>

          {prohibitedCount > 0 && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-4">
              <h3 className="text-sm font-semibold text-destructive">{t("tools.highRisk")}              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI system appears to engage in prohibited practices under
                EU AI Act Article 5. These practices are banned in the EU and
                cannot be brought into compliance. You must redesign or
                discontinue the system before deployment.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {CHECK_ITEMS.filter(
                  (item) =>
                    item.severity === "prohibited" && answers[item.id] === true
                ).map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {item.title} ({item.articleRef})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prohibitedCount === 0 && restrictedCount === 0 && (
            <div className="mt-4 rounded-md border border-accent/50 bg-accent/10 p-4">
              <h3 className="text-sm font-semibold text-accent">{t("tools.compliant")}              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI system does not appear to engage in any prohibited or
                restricted practices under Article 5. Continue with the{" "}
                <a href="/tools/risk-assessment" className="text-primary hover:underline">
                  Art.6 Risk Assessment
                </a>{" "}
                to determine your compliance obligations.
              </p>
            </div>
          )}

          {prohibitedCount === 0 && restrictedCount > 0 && (
            <div className="mt-4 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
              <h3 className="text-sm font-semibold text-yellow-600">{t("tools.partiallyCompliant")}              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your AI system engages in restricted practices that require
                specific safeguards or exceptions. Review the applicable
                articles and ensure compliance with transparency and consent
                requirements.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual check item card
 */
function CheckCard({
  index,
  item,
  answer,
  onAnswer,
}: {
  index: number;
  item: CheckItem;
  answer: boolean | null;
  onAnswer: (id: string, value: boolean) => void;
}) {
  const severityColor =
    item.severity === "prohibited"
      ? "border-destructive/30 bg-destructive/5"
      : "border-yellow-500/30 bg-yellow-500/5";

  const severityBadge =
    item.severity === "prohibited" ? (
      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">Prohibited      </span>
    ) : (
      <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs font-medium text-yellow-600">Restricted      </span>
    );

  return (
    <div className={`rounded-lg border p-5 ${severityColor}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {index}
        </span>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            {severityBadge}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <p className="text-xs text-muted-foreground">
            Ref: {item.articleRef}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onAnswer(item.id, true)}
              className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                answer === true
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >Yes            </button>
            <button
              type="button"
              onClick={() => onAnswer(item.id, false)}
              className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                answer === false
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >No            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
