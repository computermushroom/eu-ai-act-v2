// Art.6 Risk Classification Self-Assessment Tool
// Client Component: interactive questionnaire with real-time scoring
// Free tier feature - available to all users

"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { AIRiskLevel } from "@/types";
import { useTranslations } from "next-intl";

/**
 * Single assessment question
 */
interface Question {
  id: string;
  text: string;
  articleRef: string;
  weight: number; // Impact on risk score
}

/**
 * Art.6 risk classification questions
 * Based on EU AI Act Annex III high-risk categories and Art.6(2) criteria
 */
const QUESTIONS: Question[] = [
  {
    id: "biometric",
    text: "Does your AI system perform remote biometric identification in real-time or post-hoc?",
    articleRef: "Art.6(2), Annex III(1)",
    weight: 5,
  },
  {
    id: "critical_infrastructure",
    text: "Is your AI system used as a safety component in critical infrastructure (transport, water, gas, electricity)?",
    articleRef: "Art.6(2), Annex III(2)",
    weight: 5,
  },
  {
    id: "education",
    text: "Does your AI system determine access to or evaluate outcomes in education or vocational training?",
    articleRef: "Art.6(2), Annex III(3)",
    weight: 4,
  },
  {
    id: "employment",
    text: "Is your AI system used for recruitment, promotion, termination, or task allocation decisions?",
    articleRef: "Art.6(2), Annex III(4)",
    weight: 4,
  },
  {
    id: "essential_services",
    text: "Does your AI system evaluate credit scoring, creditworthiness, or access to essential services (healthcare, housing)?",
    articleRef: "Art.6(2), Annex III(5)",
    weight: 4,
  },
  {
    id: "law_enforcement",
    text: "Is your AI system used by law enforcement for risk assessment, polygraphs, or evidence evaluation?",
    articleRef: "Art.6(2), Annex III(6)",
    weight: 5,
  },
  {
    id: "migration",
    text: "Does your AI system assist in migration, asylum, or border control decisions?",
    articleRef: "Art.6(2), Annex III(7)",
    weight: 4,
  },
  {
    id: "justice",
    text: "Is your AI system used to assist judicial authorities in researching or interpreting facts and law?",
    articleRef: "Art.6(2), Annex III(8)",
    weight: 4,
  },
  {
    id: "chatbot",
    text: "Is your AI system a chatbot or conversational agent interacting directly with humans?",
    articleRef: "Art.6(3), Art.50",
    weight: 2,
  },
  {
    id: "emotion",
    text: "Does your AI system recognize or infer emotions in workplace or educational settings?",
    articleRef: "Art.5(1)(b), Art.6(2)",
    weight: 5,
  },
];

/**
 * Risk level thresholds based on cumulative score
 */
function determineRiskLevel(score: number): {
  level: AIRiskLevel;
  label: string;
  color: string;
  description: string;
} {
  if (score >= 15) {
    return {
      level: "unacceptable",
      label: "Unacceptable Risk",
      color: "text-destructive",
      description:
        "Your AI system may fall under prohibited practices (Art.5) or high-risk categories (Art.6). Immediate compliance action is required.",
    };
  }
  if (score >= 8) {
    return {
      level: "high",
      label: "High Risk",
      color: "text-orange-600",
      description:
        "Your AI system likely qualifies as high-risk under Art.6(2). You must comply with Art.8-15 obligations including risk management, data governance, and conformity assessment.",
    };
  }
  if (score >= 3) {
    return {
      level: "limited",
      label: "Limited Risk",
      color: "text-yellow-600",
      description:
        "Your AI system has limited risk obligations. You must comply with Art.50 transparency requirements (e.g., chatbot disclosure).",
    };
  }
  return {
    level: "minimal",
    label: "Minimal Risk",
    color: "text-accent",
    description:
      "Your AI system poses minimal risk. No specific obligations apply, but adherence to voluntary codes of conduct is recommended.",
    };
}

/**
 * Minimal type for AI system selector
 */
interface AISystemOption {
  id: string;
  name: string;
}

/**
 * Art.6 Risk Classification Self-Assessment Tool
 */
export default function RiskAssessmentPage() {
  const t = useTranslations();

  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [showResults, setShowResults] = useState(false);
  const [systems, setSystems] = useState<AISystemOption[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        const list = data.data ?? [];
        setSystems(list.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      }
    } catch (error) {
      console.error("[RISK-ASSESSMENT] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const handleAnswer = useCallback((questionId: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (showResults) setShowResults(false);
  }, [showResults]);

  const calculateScore = useCallback((): number => {
    return QUESTIONS.reduce((total, q) => {
      if (answers[q.id] === true) {
        return total + q.weight;
      }
      return total;
    }, 0);
  }, [answers]);

  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const score = calculateScore();
  const result = showResults ? determineRiskLevel(score) : null;

  const handleSubmit = useCallback(() => {
    if (!allAnswered) return;
    setShowResults(true);
  }, [allAnswered]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setShowResults(false);
    setSaveMessage(null);
  }, []);

  const handleSaveResults = useCallback(async () => {
    if (!selectedSystemId || !result) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const art6Compliant = result.level === "high" || result.level === "limited" || result.level === "minimal";

      // PATCH the AI system with risk level and compliance status
      const patchRes = await fetch(`/api/ai-systems/${selectedSystemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskLevel: result.level,
          art6Compliant,
          status: "active",
        }),
      });

      if (!patchRes.ok) {
        throw new Error("Failed to update AI system");
      }

      // Create audit log entry
      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "risk_assessment_completed",
          resource: `ai-system:${selectedSystemId}`,
          details: {
            riskLevel: result.level,
            riskScore: score,
            art6Compliant,
            answers,
          },
        }),
      });

      setSaveMessage({ type: "success", text: t("tools.saved") });
    } catch (error) {
      console.error("[RISK-ASSESSMENT] Failed to save results:", error);
      setSaveMessage({ type: "error", text: t("tools.errorSaving") });
    } finally {
      setIsSaving(false);
    }
  }, [selectedSystemId, result, score, answers]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 6
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Classification Self-Assessment</h1>
        <p className="text-muted-foreground">
          Answer 10 questions about your AI system to determine its risk level
          under EU AI Act Article 6. This assessment covers Annex III
          high-risk categories and Art.5 prohibited practices.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-8">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("tools.selectSystem")}</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {systems.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("tools.noSystems")}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mt-8">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("tools.results")} {answeredCount} / {QUESTIONS.length}
          </span>
          {allAnswered && (
            <span className="text-accent">{t("tools.results")}</span>
          )}
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{
              width: `${(answeredCount / QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="mt-8 space-y-6">
        {QUESTIONS.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index + 1}
            question={question}
            answer={answers[question.id] ?? null}
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
      {result && (
        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold">{t("tools.results")}</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t("tools.riskLevel")}
              </span>
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-sm text-muted-foreground">/ 35</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                {t("tools.category")}
              </span>
              <p className={`text-xl font-bold ${result.color}`}>
                {result.label}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.description}
            </p>

            {/* Recommended next steps */}
            <div className="rounded-md border border-border bg-background p-4">
              <h3 className="text-sm font-semibold">{t("tools.results")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {result.level === "unacceptable" && (
                  <>
                    <li>Review Art.5 prohibited practices immediately</li>
                    <li>Consult legal counsel before deployment</li>
                    <li>Consider redesigning the AI system</li>
                  </>
                )}
                {result.level === "high" && (
                  <>
                    <li>
                      Use our{" "}
                      <Link
                        href="/tools/documentation"
                        className="text-primary hover:underline"
                      >{t("tools.results")}                      </Link>{" "}
                      for Annex IV compliance
                    </li>
                    <li>Complete the Art.9 Risk Management assessment</li>
                    <li>Prepare for Art.43 Conformity Assessment</li>
                  </>
                )}
                {result.level === "limited" && (
                  <>
                    <li>
                      Use our{" "}
                      <Link
                        href="/tools/transparency"
                        className="text-primary hover:underline"
                      >
                        Transparency Check
                      </Link>{" "}
                      for Art.50 compliance
                    </li>
                    <li>Document your transparency measures</li>
                  </>
                )}
                {result.level === "minimal" && (
                  <>
                    <li>Monitor for changes in AI system scope</li>
                    <li>Stay updated on regulatory developments</li>
                  </>
                )}
              </ul>
            </div>

            {/* Save Results */}
            <div className="mt-4 space-y-3">
              {!saveMessage && (
                <button
                  type="button"
                  onClick={handleSaveResults}
                  disabled={!selectedSystemId || isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Results"}
                </button>
              )}
              {!selectedSystemId && !saveMessage && (
                <p className="text-xs text-muted-foreground">
                  Select an AI system above to save these results.
                </p>
              )}
              {saveMessage && (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    saveMessage.type === "success"
                      ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200"
                      : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
                  }`}
                >
                  {saveMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual question card with Yes/No toggle
 */
function QuestionCard({
  index,
  question,
  answer,
  onAnswer,
}: {
  index: number;
  question: Question;
  answer: boolean | null;
  onAnswer: (id: string, value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {index}
        </span>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{question.text}</p>
          <p className="text-xs text-muted-foreground">
            Ref: {question.articleRef}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onAnswer(question.id, true)}
              className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                answer === true
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >Yes            </button>
            <button
              type="button"
              onClick={() => onAnswer(question.id, false)}
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
