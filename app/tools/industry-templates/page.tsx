// Industry Templates Tool Page
// Client Component: pre-built compliance templates for different industries
// Starter tier: first 3 industries | Business tier: all 5 industries

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface AISystem {
  id: string;
  name: string;
}

interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: string;
  riskFactors: string[];
  aiUseCases: { name: string; riskLevel: string; description: string }[];
  classificationGuidance: string[];
  prohibitedWarnings: string[];
  dataGovernanceItems: string[];
  transparencyItems: string[];
}

interface AppliedTemplate {
  id: string;
  templateName: string;
  templateIcon: string;
  systemName: string;
  appliedAt: string;
  documentId: string;
}

// ---------------------------------------------------------------------------
// Industry Template Data
// ---------------------------------------------------------------------------

const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  // 1. Marketing / Advertising
  {
    id: "marketing-advertising",
    name: "Marketing & Advertising",
    icon: "📣",
    description:
      "Compliance templates for AI used in ad targeting, content generation, customer segmentation, and marketing analytics.",
    tier: "starter",
    riskFactors: [
      "Manipulative targeting of vulnerable consumer groups (Art.5(1)(a))",
      "Use of personal data for behavioral profiling without consent",
      "Dark patterns or subliminal techniques in AI-generated ads",
      "Discriminatory ad delivery based on protected characteristics",
      "Lack of transparency about AI-generated marketing content",
      "Automated A/B testing that may exploit user vulnerabilities",
    ],
    aiUseCases: [
      {
        name: "Programmatic Ad Targeting",
        riskLevel: "Limited",
        description:
          "AI-driven real-time bidding and audience targeting for digital advertising. Must ensure non-discriminatory targeting and GDPR-compliant data processing.",
      },
      {
        name: "AI Content Generation",
        riskLevel: "Limited",
        description:
          "Generative AI for marketing copy, images, and video. Must disclose AI-generated content per Art.50(2) deepfake transparency obligations.",
      },
      {
        name: "Customer Segmentation",
        riskLevel: "Limited",
        description:
          "AI clustering and profiling for audience segmentation. Risk of discriminatory outcomes if sensitive attributes are inferred.",
      },
      {
        name: "Predictive Analytics",
        riskLevel: "Limited",
        description:
          "AI models predicting customer lifetime value and churn. Must avoid exploitative targeting of vulnerable segments.",
      },
      {
        name: "Dynamic Pricing in Ads",
        riskLevel: "Limited",
        description:
          "AI-powered personalized pricing for advertising inventory. Must not discriminate based on protected characteristics.",
      },
    ],
    classificationGuidance: [
      "Most marketing AI falls under Limited Risk (Art.50) requiring transparency disclosures",
      "AI content generation triggers Art.50(2) labeling obligations for AI-generated content",
      "Ad targeting that exploits vulnerabilities may cross into Prohibited territory (Art.5(1)(a))",
      "Customer segmentation using sensitive data inferences requires GDPR DPIA + Art.10 data governance",
      "Real-time bidding systems processing biometric data may be High Risk under Annex III(1)",
    ],
    prohibitedWarnings: [
      "PROHIBITED: AI systems that deploy subliminal techniques to distort consumer behavior (Art.5(1)(a))",
      "PROHIBITED: Exploiting vulnerabilities of specific consumer groups (children, elderly, financially distressed) (Art.5(1)(b))",
      "PROHIBITED: Social scoring mechanisms that classify consumers based on socioeconomic behavior (Art.5(1)(c))",
      "WARNING: Emotion recognition in marketing contexts is banned in workplace/education but may apply to consumer profiling",
      "WARNING: Untargeted facial image scraping for ad personalization databases (Art.5(1)(d))",
    ],
    dataGovernanceItems: [
      "Verify lawful basis for processing personal data in ad targeting (GDPR Art.6)",
      "Document data sources for training ad AI models, including third-party data providers",
      "Implement bias testing across demographic groups for targeting algorithms",
      "Establish data retention policies for behavioral and profiling data",
      "Audit training datasets for representation of protected groups",
      "Maintain records of data processing activities for ad AI systems",
      "Validate consent mechanisms for behavioral advertising",
    ],
    transparencyItems: [
      "Disclose when marketing content is AI-generated (Art.50(2))",
      "Inform users when they are interacting with AI chatbots for customer engagement",
      "Provide clear opt-out mechanisms for AI-driven personalization",
      "Publish transparency reports on ad targeting criteria and data usage",
      "Label AI-generated images, videos, and audio in marketing materials",
      "Include privacy notices explaining AI-driven profiling in user-facing terms",
    ],
  },

  // 2. E-commerce
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "🛒",
    description:
      "Compliance templates for AI used in product recommendations, price optimization, fraud detection, and customer-facing chatbots.",
    tier: "starter",
    riskFactors: [
      "Manipulative recommendation algorithms driving purchasing decisions",
      "Dynamic pricing algorithms that may discriminate between users",
      "Automated fraud detection with potential for false positives affecting access to services",
      "Biased product recommendations based on inferred sensitive attributes",
      "Data-intensive profiling of consumer behavior and preferences",
      "Chatbot interactions requiring transparency disclosure",
    ],
    aiUseCases: [
      {
        name: "Recommendation Engines",
        riskLevel: "Limited",
        description:
          "Personalized product recommendations based on browsing and purchase history. Must ensure transparency and avoid manipulative design patterns.",
      },
      {
        name: "Dynamic Price Optimization",
        riskLevel: "Limited",
        description:
          "AI algorithms adjusting prices based on demand, competition, and user profiles. Must not discriminate based on protected characteristics.",
      },
      {
        name: "Fraud Detection",
        riskLevel: "High",
        description:
          "AI systems flagging fraudulent transactions. May affect access to essential services (Art.6(2), Annex III(5)). Requires human oversight for disputed cases.",
      },
      {
        name: "Customer Service Chatbots",
        riskLevel: "Limited",
        description:
          "Conversational AI handling customer inquiries and returns. Must disclose AI nature per Art.50(1) and provide escalation to human agents.",
      },
      {
        name: "Inventory Demand Forecasting",
        riskLevel: "Minimal",
        description:
          "AI models predicting product demand for supply chain optimization. Minimal risk as it does not directly affect consumer rights.",
      },
    ],
    classificationGuidance: [
      "Recommendation engines are generally Limited Risk under Art.50 transparency obligations",
      "Fraud detection that blocks transactions may qualify as High Risk (Annex III(5)) if it affects access to essential services",
      "Dynamic pricing AI requires anti-discrimination audits to ensure compliance with Art.5 and EU non-discrimination law",
      "Chatbots fall under Art.50(1) transparency obligation - users must know they are interacting with AI",
      "Inventory and supply chain AI typically qualifies as Minimal Risk with no specific obligations",
    ],
    prohibitedWarnings: [
      "PROHIBITED: Recommendation AI that exploits vulnerabilities to drive impulse purchases (Art.5(1)(a))",
      "PROHIBITED: Price optimization that discriminates based on location, race, or socioeconomic status (Art.5 + EU Charter)",
      "WARNING: Fraud detection systems must include human appeal mechanisms - fully automated service denial may violate Art.14 human oversight",
      "WARNING: Dark patterns in AI-driven checkout flows may constitute subliminal manipulation (Art.5(1)(a))",
      "WARNING: Customer profiling using inferred sensitive data (health conditions from purchases) requires heightened scrutiny",
    ],
    dataGovernanceItems: [
      "Document data sources for recommendation and pricing algorithms",
      "Test recommendation outputs for bias across demographic segments",
      "Implement data minimization for consumer profiling datasets",
      "Establish data sharing agreements with third-party data enrichment providers",
      "Conduct regular accuracy audits of fraud detection models to minimize false positives",
      "Maintain training data provenance records for all e-commerce AI systems",
      "Validate that consumer data used for AI training was collected with valid consent",
    ],
    transparencyItems: [
      "Disclose AI chatbot identity at the start of every customer interaction (Art.50(1))",
      "Explain why specific products are recommended to users upon request",
      "Notify customers when fraud detection AI has blocked or flagged a transaction",
      "Provide clear information about dynamic pricing practices",
      "Offer human agent escalation paths for all AI-driven customer interactions",
      "Include AI usage information in platform terms of service and privacy policy",
    ],
  },

  // 3. Customer Service
  {
    id: "customer-service",
    name: "Customer Service",
    icon: "🎧",
    description:
      "Compliance templates for AI used in support chatbots, sentiment analysis, ticket routing, and quality monitoring.",
    tier: "starter",
    riskFactors: [
      "Chatbot interactions failing to disclose AI nature to customers",
      "Sentiment analysis inferring emotions in service contexts (Art.5 restriction)",
      "Automated ticket routing that may systematically deprioritize certain customer groups",
      "Quality monitoring AI that performs unauthorized employee surveillance",
      "Bias in AI-driven response generation affecting service quality",
      "Insufficient human oversight for complex or escalated customer issues",
    ],
    aiUseCases: [
      {
        name: "Customer Support Chatbots",
        riskLevel: "Limited",
        description:
          "AI-powered conversational agents handling routine customer inquiries. Must comply with Art.50(1) transparency and provide human escalation.",
      },
      {
        name: "Sentiment Analysis",
        riskLevel: "Limited",
        description:
          "AI analyzing customer communications for emotional tone. Note: emotion recognition in workplace contexts is prohibited (Art.5(1)(f)).",
      },
      {
        name: "Automated Ticket Routing",
        riskLevel: "Limited",
        description:
          "AI classifying and prioritizing support tickets. Must ensure non-discriminatory routing across all customer segments.",
      },
      {
        name: "Quality Monitoring",
        riskLevel: "Limited",
        description:
          "AI evaluating customer service interactions for quality and compliance. Must respect employee privacy and avoid unauthorized surveillance.",
      },
      {
        name: "Knowledge Base Search",
        riskLevel: "Minimal",
        description:
          "AI-powered search and retrieval for support documentation. Minimal risk with standard data protection obligations.",
      },
    ],
    classificationGuidance: [
      "Customer-facing chatbots are Limited Risk under Art.50(1) - must disclose AI identity",
      "Sentiment analysis used on employees (agent quality monitoring) may trigger Art.5(1)(f) workplace emotion recognition prohibition",
      "Ticket routing AI is generally Limited Risk unless it determines access to essential services",
      "Quality monitoring AI should be assessed for workplace surveillance implications under national labor law",
      "Internal knowledge base AI typically qualifies as Minimal Risk",
    ],
    prohibitedWarnings: [
      "PROHIBITED: Emotion recognition AI analyzing customer service agents' emotional states in the workplace (Art.5(1)(f))",
      "WARNING: Sentiment analysis on customer communications is permissible but requires GDPR compliance and purpose limitation",
      "WARNING: Automated ticket routing that systematically deprioritizes complaints from protected groups may violate anti-discrimination law",
      "WARNING: Quality monitoring without employee notification may violate workplace privacy regulations",
      "PROHIBITED: AI that manipulates customers into not pursuing complaints or legal rights (Art.5(1)(a))",
    ],
    dataGovernanceItems: [
      "Document consent and legal basis for analyzing customer communications",
      "Ensure training data for chatbots is free from biased or discriminatory language patterns",
      "Implement data access controls for quality monitoring AI outputs",
      "Establish retention limits for recorded customer service interactions",
      "Audit sentiment analysis models for cultural and linguistic bias",
      "Maintain separation between customer data used for AI training and operational data",
      "Validate that agent performance data from quality monitoring is used fairly and transparently",
    ],
    transparencyItems: [
      "Clearly disclose AI chatbot identity at the beginning of every interaction (Art.50(1))",
      "Inform customers about how their data is used to improve AI service quality",
      "Notify employees when AI quality monitoring is in use and what metrics are tracked",
      "Provide customers with the option to speak to a human agent at any point",
      "Explain ticket routing criteria when customers ask about prioritization",
      "Publish AI usage policy in customer-facing help documentation",
    ],
  },

  // 4. Healthcare
  {
    id: "healthcare",
    name: "Healthcare",
    icon: "🏥",
    description:
      "Compliance templates for AI used in diagnostics, clinical decision support, medical imaging, and patient triage. High-risk classification likely.",
    tier: "business",
    riskFactors: [
      "Direct impact on patient safety and health outcomes",
      "Potential for biased diagnostic outcomes across demographic groups",
      "Processing of sensitive health data (special category under GDPR Art.9)",
      "Clinical decisions with significant effects on patient treatment paths",
      "Regulatory overlap with MDR/IVDR medical device requirements",
      "High consequence of errors in diagnostic and triage AI systems",
    ],
    aiUseCases: [
      {
        name: "Diagnostic AI",
        riskLevel: "High",
        description:
          "AI systems assisting in or performing medical diagnosis. High Risk under Annex III(5) - access to essential healthcare services. Requires conformity assessment.",
      },
      {
        name: "Clinical Decision Support",
        riskLevel: "High",
        description:
          "AI providing treatment recommendations to clinicians. High Risk as it materially influences clinical decisions affecting patient health.",
      },
      {
        name: "Medical Imaging Analysis",
        riskLevel: "High",
        description:
          "AI analyzing radiology, pathology, or dermatology images. High Risk under Annex III(5) and potentially subject to MDR/IVDR as a medical device.",
      },
      {
        name: "Patient Triage Systems",
        riskLevel: "High",
        description:
          "AI prioritizing patient care based on symptoms and urgency. High Risk as it determines access to essential healthcare services (Annex III(5)).",
      },
      {
        name: "Healthcare Chatbots",
        riskLevel: "Limited",
        description:
          "AI chatbots providing general health information and appointment scheduling. Limited Risk with Art.50 transparency obligations, provided they do not give medical advice.",
      },
    ],
    classificationGuidance: [
      "Most healthcare AI qualifies as High Risk under Annex III(5) - access to essential private services",
      "Diagnostic AI, clinical decision support, and medical imaging are almost certainly High Risk",
      "Patient triage AI determining urgency of care is High Risk under Annex III(5)",
      "Healthcare chatbots providing general (non-diagnostic) information may be Limited Risk under Art.50",
      "All healthcare AI must additionally comply with MDR/IVDR if classified as a medical device",
      "FRIA (Art.27) is mandatory for public healthcare deployers",
    ],
    prohibitedWarnings: [
      "PROHIBITED: AI systems that exploit patient vulnerability (e.g., terminal illness, mental health crises) to distort behavior (Art.5(1)(b))",
      "PROHIBITED: Social scoring of patients based on health behaviors or socioeconomic status (Art.5(1)(c))",
      "WARNING: Diagnostic AI must never replace clinical judgment entirely - human oversight is mandatory (Art.14)",
      "WARNING: Patient triage AI errors could lead to life-threatening delays in care",
      "WARNING: Using healthcare AI for insurance eligibility decisions requires separate compliance assessment",
      "PROHIBITED: Emotion recognition in patient care contexts for non-medical purposes (Art.5(1)(f))",
    ],
    dataGovernanceItems: [
      "Ensure all training data complies with GDPR Art.9 for special category health data",
      "Document informed consent mechanisms for patient data used in AI training",
      "Validate training dataset representativeness across age, gender, ethnicity, and comorbidities",
      "Implement strict data access controls and pseudonymization for health records",
      "Establish data sharing agreements compliant with MDR/IVDR for clinical validation data",
      "Conduct bias audits across demographic groups with clinical significance thresholds",
      "Maintain comprehensive data lineage for all patient data used in AI development",
      "Ensure training data includes diverse populations to avoid algorithmic bias in diagnostics",
    ],
    transparencyItems: [
      "Inform patients when AI is used in their diagnostic or treatment process",
      "Provide clinicians with explainable outputs and confidence scores from diagnostic AI",
      "Disclose AI involvement in triage decisions to patients and healthcare staff",
      "Publish clinical validation results and performance metrics for healthcare AI systems",
      "Include AI usage information in patient consent forms and treatment plans",
      "Ensure healthcare chatbots clearly state they do not provide medical advice (Art.50(1))",
      "Document and communicate known limitations and contraindications of clinical AI tools",
    ],
  },

  // 5. Finance
  {
    id: "finance",
    name: "Finance",
    icon: "💰",
    description:
      "Compliance templates for AI used in credit scoring, fraud detection, AML/KYC, algorithmic trading, and insurance underwriting.",
    tier: "business",
    riskFactors: [
      "Significant impact on individuals' access to financial services",
      "Potential for discriminatory lending and credit decisions",
      "Processing of sensitive financial and behavioral data",
      "High-stakes automated decisions affecting financial outcomes",
      "Regulatory overlap with PSD2, MiFID II, and DORA requirements",
      "Systemic risk implications for algorithmic trading AI",
    ],
    aiUseCases: [
      {
        name: "Credit Scoring",
        riskLevel: "High",
        description:
          "AI evaluating creditworthiness for loans and financial products. High Risk under Annex III(5) - access to essential financial services. Requires conformity assessment.",
      },
      {
        name: "Fraud Detection",
        riskLevel: "High",
        description:
          "AI systems detecting fraudulent financial transactions. High Risk when automated blocking affects access to banking services (Annex III(5)).",
      },
      {
        name: "AML / KYC Verification",
        riskLevel: "High",
        description:
          "AI performing anti-money laundering checks and know-your-customer verification. High Risk as it determines access to essential financial services.",
      },
      {
        name: "Algorithmic Trading",
        riskLevel: "Limited",
        description:
          "AI-driven automated trading strategies. Subject to MiFID II requirements. Limited direct EU AI Act risk unless it manages critical infrastructure.",
      },
      {
        name: "Insurance Underwriting",
        riskLevel: "High",
        description:
          "AI assessing risk and pricing insurance policies. High Risk under Annex III(5) - access to essential private services (insurance).",
      },
    ],
    classificationGuidance: [
      "Credit scoring AI is High Risk under Annex III(5) - directly determines access to financial services",
      "Fraud detection AI that automatically blocks transactions is High Risk when it affects access to essential banking",
      "AML/KYC AI is High Risk as it controls access to financial services and may involve biometric identification",
      "Algorithmic trading AI is primarily regulated under MiFID II; EU AI Act classification depends on infrastructure role",
      "Insurance underwriting AI is High Risk under Annex III(5) - access to essential private services",
      "All financial AI must comply with GDPR, PSD2, and sector-specific regulations in addition to EU AI Act",
    ],
    prohibitedWarnings: [
      "PROHIBITED: Credit scoring AI that uses social behavior or personal characteristics unrelated to creditworthiness (Art.5(1)(c) social scoring)",
      "WARNING: Credit decisions based solely on AI profiling without human review may violate Art.14 human oversight requirements",
      "PROHIBITED: AI exploiting financial vulnerability (e.g., targeting distressed borrowers with predatory offers) (Art.5(1)(b))",
      "WARNING: Insurance underwriting using inferred sensitive data (health conditions from lifestyle data) requires DPIA",
      "WARNING: Biometric KYC systems must comply with both Art.5(1)(d) facial recognition restrictions and Annex III(1)",
      "WARNING: Algorithmic trading AI must not create systemic risk - overlaps with DORA critical infrastructure requirements",
    ],
    dataGovernanceItems: [
      "Document all data sources used in credit scoring models, including alternative data providers",
      "Test credit and insurance AI for discriminatory outcomes across protected groups",
      "Implement explainability requirements for automated financial decisions",
      "Establish data retention policies compliant with financial regulations and GDPR",
      "Validate AML/KYC training data for geographic and demographic representativeness",
      "Maintain audit trails for all AI-driven financial decisions",
      "Conduct regular bias testing on lending and insurance models with regulatory reporting",
      "Ensure third-party data providers comply with EU data protection standards",
    ],
    transparencyItems: [
      "Inform applicants when AI is used in credit decisions and provide explanation of key factors (GDPR Art.22)",
      "Notify customers when fraud detection AI has blocked or restricted their accounts",
      "Disclose AI involvement in insurance pricing and underwriting decisions",
      "Provide human review mechanisms for all significant AI-driven financial decisions",
      "Publish model performance metrics and fairness indicators for credit scoring AI",
      "Include AI usage disclosures in financial product terms and conditions",
      "Offer clear appeal and redress mechanisms for AI-affected financial decisions",
    ],
  },
];

// ---------------------------------------------------------------------------
// Risk level color mapping
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<string, string> = {
  High: "bg-red-500/10 text-red-700",
  Limited: "bg-amber-500/10 text-amber-700",
  Minimal: "bg-emerald-500/10 text-emerald-700",
  Unacceptable: "bg-destructive/10 text-destructive",
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function IndustryTemplatesPage() {
  const t = useTranslations();

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedTemplates, setAppliedTemplates] = useState<AppliedTemplate[]>(
    []
  );
  const [isLoadingSystems, setIsLoadingSystems] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [userTier, setUserTier] = useState<string>("free");

  // Fetch user tier and AI systems
  useEffect(() => {
    async function fetchData() {
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserTier(profileData?.user?.subscription?.tier ?? "free");
        }
      } catch {
        // ignore
      }

      setIsLoadingSystems(true);
      try {
        const systemsRes = await fetch("/api/ai-systems");
        if (systemsRes.ok) {
          const data = await systemsRes.json();
          setSystems(data.data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingSystems(false);
      }
    }
    fetchData();
  }, []);

  // Fetch applied templates history
  useEffect(() => {
    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch("/api/documents?type=industry-template");
        if (res.ok) {
          const data = await res.json();
          setAppliedTemplates(data.data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  const tierOrder = ["free", "starter", "professional", "business", "enterprise"];
  const isAccessible = (templateTier: string) =>
    tierOrder.indexOf(userTier) >= tierOrder.indexOf(templateTier);

  const selectedTemplate = INDUSTRY_TEMPLATES.find(
    (t) => t.id === selectedIndustry
  );

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedTemplate || !selectedSystem) return;

    setIsApplying(true);
    setApplySuccess(null);
    setApplyError(null);

    try {
      const documentBody = {
        title: `${selectedTemplate.name} Compliance Template`,
        type: "industry-template",
        content: {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          systemId: selectedSystem,
          systemName:
            systems.find((s) => s.id === selectedSystem)?.name ?? selectedSystem,
          riskFactors: selectedTemplate.riskFactors,
          aiUseCases: selectedTemplate.aiUseCases,
          classificationGuidance: selectedTemplate.classificationGuidance,
          prohibitedWarnings: selectedTemplate.prohibitedWarnings,
          dataGovernanceItems: selectedTemplate.dataGovernanceItems,
          transparencyItems: selectedTemplate.transparencyItems,
        },
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(documentBody),
      });

      if (!res.ok) {
        throw new Error("Failed to save template document");
      }

      const data = await res.json();

      setApplySuccess(
        `Template applied successfully and saved as document "${data.document?.title ?? documentBody.title}".`
      );

      // Add to local list
      setAppliedTemplates((prev) => [
        {
          id: data.document?.id ?? Date.now().toString(),
          templateName: selectedTemplate.name,
          templateIcon: selectedTemplate.icon,
          systemName:
            systems.find((s) => s.id === selectedSystem)?.name ??
            selectedSystem,
          appliedAt: new Date().toISOString(),
          documentId: data.document?.id ?? "",
        },
        ...prev,
      ]);
    } catch (err) {
      setApplyError(
        err instanceof Error ? err.message : "Failed to apply template"
      );
    } finally {
      setIsApplying(false);
    }
  }, [selectedTemplate, selectedSystem, systems]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Templates
          </span>
          <span className="text-xs text-muted-foreground">
            Starter &amp; Business
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Industry Compliance Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Pre-built EU AI Act compliance templates tailored to your industry.
          Select an industry, review the template, and apply it to one of your AI
          systems to generate a compliance document.
        </p>
      </div>

      {/* Industry Selector */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold">Select Industry</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the industry that best matches your AI system use case.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRY_TEMPLATES.map((template) => {
            const accessible = isAccessible(template.tier);
            const isSelected = selectedIndustry === template.id;

            return (
              <button
                key={template.id}
                type="button"
                disabled={!accessible}
                onClick={() => setSelectedIndustry(template.id)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                  !accessible
                    ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
                    : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl">{template.icon}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      template.tier === "starter"
                        ? "bg-primary/10 text-primary"
                        : "bg-orange-500/10 text-orange-600"
                    }`}
                  >
                    {template.tier === "starter" ? "Starter" : "Business"}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{template.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                {!accessible && (
                  <span className="mt-2 text-xs text-muted-foreground">
                    Upgrade to {template.tier} to unlock
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Detail */}
      {selectedTemplate && (
        <div className="mt-10 space-y-6">
          {/* Template Header */}
          <div className="rounded-lg border border-border bg-background p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedTemplate.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <Section title="Industry-Specific Risk Factors" icon="⚠️">
            <ul className="space-y-2">
              {selectedTemplate.riskFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">{factor}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* AI Use Cases */}
          <Section title="Common AI Use Cases" icon="🤖">
            <div className="space-y-3">
              {selectedTemplate.aiUseCases.map((useCase, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{useCase.name}</h4>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[useCase.riskLevel] ?? RISK_COLORS.Limited}`}
                    >
                      {useCase.riskLevel} Risk
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Classification Guidance */}
          <Section title="Art.6 Risk Classification Recommendations" icon="📋">
            <ul className="space-y-2">
              {selectedTemplate.classificationGuidance.map((guidance, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">{guidance}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Prohibited Practices Warnings */}
          <Section title="Prohibited Practices Warnings" icon="🚫">
            <div className="space-y-2">
              {selectedTemplate.prohibitedWarnings.map((warning, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-3 text-sm ${
                    warning.startsWith("PROHIBITED")
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">
                      {warning.startsWith("PROHIBITED") ? "⛔" : "⚡"}
                    </span>
                    <span>{warning}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Data Governance Checklist */}
          <Section title="Data Governance Checklist" icon="🗄️">
            <ul className="space-y-2">
              {selectedTemplate.dataGovernanceItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-border bg-background text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Transparency Obligations */}
          <Section title="Transparency Obligations" icon="👁️">
            <ul className="space-y-2">
              {selectedTemplate.transparencyItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Apply Template */}
          <div className="rounded-lg border border-border bg-muted/30 p-6">
            <h3 className="text-sm font-semibold">Apply Template</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Select an AI system and save this template as a compliance document
              for your records.
            </p>

            <div className="mt-4 space-y-3">
              {/* System Selector */}
              <div>
                <label
                  htmlFor="system-select"
                  className="block text-xs font-medium text-muted-foreground"
                >{t("tools.selectSystem")}                </label>
                <select
                  id="system-select"
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  disabled={isLoadingSystems}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm transition-colors focus:border-ring focus:outline-none disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingSystems
                      ? "Loading systems..."
                      : systems.length === 0
                        ? "No AI systems found"
                        : "Select an AI system..."}
                  </option>
                  {systems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Success Message */}
              {applySuccess && (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">
                  {applySuccess}
                </div>
              )}

              {/* Error Message */}
              {applyError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {applyError}
                </div>
              )}

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyTemplate}
                disabled={!selectedSystem || isApplying}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isApplying ? "Applying..." : "Apply Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previously Applied Templates */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold">Previously Applied Templates</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          History of industry templates you have applied to your AI systems.
        </p>

        <div className="mt-4 rounded-lg border border-border bg-background">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : appliedTemplates.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No templates applied yet. Select an industry above to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {appliedTemplates.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.templateIcon}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {item.templateName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied to: {item.systemName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.appliedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable Section Component
// ---------------------------------------------------------------------------

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
