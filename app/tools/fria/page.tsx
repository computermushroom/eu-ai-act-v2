// FRIA Assessment Tool - Fundamental Rights Impact Assessment (Art.27)
// Client Component: 6-section wizard with auto-save and report generation

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface FRIAAssessment {
  id: string;
  systemId: string;
  section1: string | null;
  section2: string | null;
  section3: string | null;
  section4: string | null;
  section5: string | null;
  section6: string | null;
  status: string;
  overallScore: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SectionDef {
  id: number;
  title: string;
  description: string;
  placeholder: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: 1,
    title: "System Description & Intended Purpose",
    description: "Describe the AI system, its intended purpose, and the context of deployment.",
    placeholder: "1. System name and version\n2. Intended purpose and scope\n3. Deployment context (geographic, sector)\n4. Key stakeholders affected",
  },
  {
    id: 2,
    title: "Legal Basis & Necessity",
    description: "Document the legal basis for using the AI system and demonstrate necessity.",
    placeholder: "1. Legal basis under EU or national law\n2. Necessity and proportionality analysis\n3. Less intrusive alternatives considered\n4. Expected benefits vs. risks",
  },
  {
    id: 3,
    title: "Risks to Fundamental Rights",
    description: "Identify potential risks to fundamental rights (privacy, non-discrimination, etc.).",
    placeholder: "1. Privacy and data protection risks (GDPR)\n2. Risk of discrimination or bias\n3. Impact on freedom of expression\n4. Risks to dignity, autonomy, or safety",
  },
  {
    id: 4,
    title: "Measures to Mitigate Risks",
    description: "Describe the measures planned or implemented to mitigate identified risks.",
    placeholder: "1. Technical safeguards (pseudonymization, encryption)\n2. Organizational measures (training, oversight)\n3. Human-in-the-loop arrangements\n4. Regular monitoring and auditing plans",
  },
  {
    id: 5,
    title: "Consultation with Stakeholders",
    description: "Document consultations with affected groups, experts, and authorities.",
    placeholder: "1. Consultation with affected groups\n2. Expert involvement (ethics, legal, technical)\n3. Engagement with civil society\n4. Internal review processes",
  },
  {
    id: 6,
    title: "Notification to Authority",
    description: "Record notification to the competent authority and any responses received.",
    placeholder: "1. Competent authority notified\n2. Date and method of notification\n3. Authority response or feedback\n4. Follow-up actions required",
  },
];

export default function FRIAPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [assessment, setAssessment] = useState<FRIAAssessment | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showReport, setShowReport] = useState(false);

  // Fetch user's AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[FRIA] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch FRIA assessment when system selected
  const fetchAssessment = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/fria?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.assessment) {
          setAssessment(data.assessment);
          setAnswers({
            1: data.assessment.section1 ?? "",
            2: data.assessment.section2 ?? "",
            3: data.assessment.section3 ?? "",
            4: data.assessment.section4 ?? "",
            5: data.assessment.section5 ?? "",
            6: data.assessment.section6 ?? "",
          });
        } else {
          setAssessment(null);
          setAnswers({});
        }
      }
    } catch (error) {
      console.error("[FRIA] Failed to fetch assessment:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchAssessment(selectedSystemId);
    }
  }, [selectedSystemId, fetchAssessment]);

  // Auto-save
  const saveAssessment = useCallback(async () => {
    if (!selectedSystemId) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/fria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: selectedSystemId,
          section1: answers[1] || null,
          section2: answers[2] || null,
          section3: answers[3] || null,
          section4: answers[4] || null,
          section5: answers[5] || null,
          section6: answers[6] || null,
          status: assessment?.status ?? "draft",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
        setSaveMessage(t("tools.saved"));
        setTimeout(() => setSaveMessage(""), 2000);
      }
    } catch (error) {
      console.error("[FRIA] Auto-save failed:", error);
      setSaveMessage(t("tools.errorSaving"));
    } finally {
      setIsSaving(false);
    }
  }, [selectedSystemId, answers, assessment?.status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedSystemId) {
        saveAssessment();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, selectedSystemId, saveAssessment]);

  const handleAnswerChange = (sectionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [sectionId]: value }));
  };

  const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const progress = Math.round((filledCount / 6) * 100);

  const handleNext = () => {
    if (currentSection < 5) setCurrentSection((s) => s + 1);
  };

  const handlePrev = () => {
    if (currentSection > 0) setCurrentSection((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!selectedSystemId) return;
    try {
      const res = await fetch("/api/fria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: selectedSystemId,
          section1: answers[1] || null,
          section2: answers[2] || null,
          section3: answers[3] || null,
          section4: answers[4] || null,
          section5: answers[5] || null,
          section6: answers[6] || null,
          status: "submitted",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
        setShowReport(true);
      }
    } catch (error) {
      console.error("[FRIA] Submit failed:", error);
    }
  };

  const section = SECTIONS[currentSection] ?? null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 27
          </span>
          <span className="text-xs text-muted-foreground">{t("tools.results")}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Fundamental Rights Impact Assessment</h1>
        <p className="text-muted-foreground">
          Complete the 6-section FRIA for your high-risk AI system. All fields auto-save.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-8">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => {
            setSelectedSystemId(e.target.value);
            setCurrentSection(0);
            setShowReport(false);
          }}
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
                Section {currentSection + 1} of 6
              </span>
              <span className="text-muted-foreground">
                {filledCount} / 6 sections completed
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            {saveMessage && (
              <p className="mt-1 text-xs text-muted-foreground">{saveMessage} {isSaving && "..."}</p>
            )}
          </div>

          {/* Section Steps */}
          <div className="mt-6 flex items-center gap-1">
            {SECTIONS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSection(idx)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  idx === currentSection
                    ? "bg-primary text-primary-foreground"
                    : (answers[s.id] ?? "").trim().length > 0
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.id}
              </button>
            ))}
          </div>

          {/* Wizard Content */}
          {isLoading ? (
            <div className="mt-8 text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : section ? (
            <div className="mt-8 rounded-lg border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">
                Section {section.id}: {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
              <textarea
                value={answers[section.id] ?? ""}
                onChange={(e) => handleAnswerChange(section.id, e.target.value)}
                placeholder={section.placeholder}
                rows={12}
                className="mt-4 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : null}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >{t("common.back")}            </button>
            {currentSection < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >{t("common.next")}              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={filledCount < 6}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >{t("common.submit")}              </button>
            )}
          </div>

          {/* Report */}
          {showReport && assessment && (
            <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="text-xl font-semibold">{t("tools.results")}</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t("tools.results")}:</span>
                  <span className="text-2xl font-bold">{assessment.overallScore ?? 0}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t("tools.status")}:</span>
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {assessment.status}
                  </span>
                </div>
                {SECTIONS.map((s) => (
                  <div key={s.id} className="rounded-md border border-border bg-background p-4">
                    <h3 className="text-sm font-semibold">
                      Section {s.id}: {s.title}
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {answers[s.id]?.trim() || "(Not provided)"}
                    </p>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >{t("tools.download")}                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
