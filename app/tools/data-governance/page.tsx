// Art.10 Data Governance Assessment Tool UI
// Client Component: 8 yes/no wizard questions, auto-calculates score, saves to system

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface Question {
  id: number;
  question: string;
  explanation: string;
}

interface HistoryItem {
  id: string;
  score: number;
  status: string;
  createdAt: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Do you have documented data collection procedures?",
    explanation:
      "You have clear written procedures describing how training, validation, and testing data is collected, including sources and methods.",
  },
  {
    id: 2,
    question: "Have you checked your data for relevance and representativeness?",
    explanation:
      "Your datasets match the intended use of the AI system and cover the populations, scenarios, and edge cases the system will encounter.",
  },
  {
    id: 3,
    question: "Do you perform bias detection on training data?",
    explanation:
      "You run systematic checks to identify unfair biases related to gender, age, ethnicity, or other protected characteristics before training.",
  },
  {
    id: 4,
    question: "Have you documented any known data gaps or limitations?",
    explanation:
      "You maintain a record of missing data, underrepresented groups, or situations where the data may be unreliable.",
  },
  {
    id: 5,
    question: "Do you apply data quality checks before model training?",
    explanation:
      "You validate data accuracy, completeness, and consistency, and have procedures to correct or remove bad data.",
  },
  {
    id: 6,
    question: "Is your training data legally obtained and properly licensed?",
    explanation:
      "You have the legal right to use all data for training, including proper licenses, consent, or other lawful bases under GDPR and copyright law.",
  },
  {
    id: 7,
    question: "Do you maintain version control and lineage for datasets?",
    explanation:
      "You can trace which dataset version was used for each model version, and you keep a history of changes.",
  },
  {
    id: 8,
    question: "Have you established procedures for ongoing data monitoring?",
    explanation:
      "After deployment, you continue to monitor data drift and model performance, with plans to retrain or update when needed.",
  },
];

export default function DataGovernancePage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    riskLevel: string;
    status: string;
  } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (err) {
      console.error("[DATA-GOV] Failed to fetch systems:", err);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const fetchHistory = useCallback(async (systemId: string) => {
    if (!systemId) return;
    try {
      const res = await fetch(`/api/tools/data-governance?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history ?? []);
      }
    } catch (err) {
      console.error("[DATA-GOV] Failed to fetch history:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchHistory(selectedSystemId);
      setResult(null);
      setAnswers({});
      setCurrentStep(0);
      setSaveSuccess(false);
      setError("");
    }
  }, [selectedSystemId, fetchHistory]);

  const handleAnswer = (value: boolean) => {
    const question = QUESTIONS[currentStep];
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!selectedSystemId) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tools/data-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemId: selectedSystemId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          score: data.score,
          riskLevel: data.riskLevel,
          status: data.status,
        });
        fetchHistory(selectedSystemId);
      } else {
        setError(data.error ?? "Assessment failed");
      }
    } catch (err) {
      console.error("[DATA-GOV] Submit failed:", err);
      setError(t("tools.errorSaving"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveToSystem = async () => {
    if (!selectedSystemId || !result) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tools/data-governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: selectedSystemId,
          answers,
          saveToSystem: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setError(data.error ?? "Save failed");
      }
    } catch (err) {
      console.error("[DATA-GOVERNANCE] Save failed:", err);
      setError(t("tools.errorSaving"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[currentStep] ?? null;
  const answeredCount = Object.values(answers).filter((v) => typeof v === "boolean").length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-accent/10 text-accent";
    if (score >= 50) return "bg-orange-500/10 text-orange-600";
    return "bg-red-500/10 text-red-600";
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 10
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Data Governance Assessment</h1>
        <p className="text-muted-foreground">
          Answer 8 simple yes/no questions about your AI system&apos;s data practices. We auto-calculate your compliance score.
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

      {selectedSystemId && (
        <>
          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentStep + 1} of {QUESTIONS.length}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Wizard */}
          {!result && currentQuestion ? (
            <div className="mt-8 rounded-lg border border-border bg-background p-6">
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Q{currentQuestion.id}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                {currentQuestion.question}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAnswer(true)}
                  className={`inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                    answers[currentQuestion.id] === true
                      ? "bg-accent text-white"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >{t("tools.compliant")}                </button>
                <button
                  type="button"
                  onClick={() => handleAnswer(false)}
                  className={`inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                    answers[currentQuestion.id] === false
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >{t("tools.nonCompliant")}                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >{t("common.back")}                </button>
                {answeredCount === QUESTIONS.length && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Calculating..." : "Calculate Score"}
                  </button>
                )}
              </div>
            </div>
          ) : result ? (
            /* Result */
            <div className="mt-8 rounded-lg border border-border bg-background p-6">
              <h2 className="text-xl font-semibold">{t("tools.results")}</h2>
              <div className="mt-4 flex items-center gap-4">
                <span className={`text-4xl font-bold ${scoreColor(result.score)}`}>
                  {result.score}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t("tools.riskLevel")}:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${scoreBg(
                    result.score
                  )}`}
                >
                  {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t("tools.status")}:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    result.status === "pass"
                      ? "bg-accent/10 text-accent"
                      : result.status === "warning"
                      ? "bg-orange-500/10 text-orange-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {result.status === "pass"
                    ? "Pass"
                    : result.status === "warning"
                    ? "Warning"
                    : "Fail"}
                </span>
              </div>

              {result.score < 100 && (
                <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                  <strong>{t("tools.results")}:</strong>
                  <ul className="mt-1 list-inside list-disc">
                    {QUESTIONS.filter((q) => answers[q.id] === false).map((q) => (
                      <li key={q.id}>{q.question}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveToSystem}
                  disabled={isSubmitting || saveSuccess}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saveSuccess
                    ? "Saved to System"
                    : isSubmitting
                    ? "Saving..."
                    : "Save to System"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                    setCurrentStep(0);
                    setSaveSuccess(false);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >{t("tools.startNewAssessment")}                </button>
              </div>
            </div>
          ) : null}

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold">{t("tools.results")}</h3>
              <div className="mt-2 space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{h.score}/100</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreBg(
                          h.score
                        )}`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
