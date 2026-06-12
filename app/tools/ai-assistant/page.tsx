// Embedded AI Compliance Assistant
// Client Component: chat-style interface with simulated AI responses

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AISystem {
  id: string;
  name: string;
}

const QUICK_ACTIONS = [
  "Check Art.6 compliance",
  "What are prohibited practices?",
  "FRIA requirements",
  "Data governance checklist",
  "QMS obligations",
  "How to classify my AI system?",
];

function generateResponse(message: string, systemName?: string): string {
  const lower = message.toLowerCase();
  const context = systemName ? `\n\nContext: Your selected AI system "${systemName}"` : "";

  if (lower.includes("art.6") || lower.includes("risk") || lower.includes("classify")) {
    return `**Article 6 - Risk Classification Guidance**

Under the EU AI Act, AI systems are classified into four risk categories:

1. **Unacceptable Risk (Art.5)**: Prohibited AI practices including:
   - Subliminal manipulation beyond consciousness
   - Exploitation of vulnerabilities of specific groups
   - Social scoring by public authorities
   - Real-time remote biometric identification in public spaces (with limited exceptions)

2. **High Risk (Art.6(2))**: Systems listed in Annex III, including:
   - Biometric identification and categorization
   - Critical infrastructure management
   - Education and vocational training
   - Employment and worker management
   - Access to essential private and public services
   - Law enforcement
   - Migration, asylum, and border control
   - Justice and democratic processes

3. **Limited Risk (Art.50)**: Transparency obligations apply, e.g.:
   - Chatbots and AI-generated content disclosure
   - Deepfake detection and labeling
   - Emotion recognition disclosure

4. **Minimal Risk**: No specific regulatory requirements.

**Key Reference**: Art.6(2) and Annex III of the EU AI Act (Regulation (EU) 2024/1689).${context}`;
  }

  if (lower.includes("prohibited") || lower.includes("banned") || lower.includes("art.5")) {
    return `**Article 5 - Prohibited AI Practices**

The EU AI Act strictly prohibits the following AI practices (Art.5):

1. **Subliminal Techniques (Art.5(1)(a))**: Deploying AI that uses subliminal, manipulative, or deceptive techniques to materially distort a person's behavior, causing significant harm.

2. **Exploitation of Vulnerabilities (Art.5(1)(b))**: Exploiting vulnerabilities of specific groups (age, disability, social/economic situation) to materially distort behavior causing significant harm.

3. **Social Scoring (Art.5(1)(c))**: Public authorities using AI for social scoring based on social behavior, socio-economic status, or personal characteristics leading to detrimental treatment.

4. **Individual Risk Assessment (Art.5(1)(d))**: Using AI to assess individual risk of criminal offense based solely on profiling or personality traits (except where based on verifiable facts connected to criminal activity).

5. **Untargeted Facial Image Scraping (Art.5(1)(e))**: Creating or expanding facial recognition databases through untargeted scraping of internet/cCTV footage.

6. **Emotion Recognition in Sensitive Contexts (Art.5(1)(f))**: Inferring emotions in workplaces and educational institutions (except for medical/safety purposes).

7. **Predictive Policing (Art.5(1)(g))**: Using AI for predictive policing based solely on profiling.

8. **Biometric Categorization Using Sensitive Characteristics (Art.5(1)(h))**: Categorizing individuals based on biometric data revealing race, political opinions, trade union membership, religious/philosophical beliefs, or sexual orientation.

**Penalties**: Up to EUR 35 million or 7% of global annual turnover.

**Key Reference**: Art.5(1)(a)-(h) of the EU AI Act.${context}`;
  }

  if (lower.includes("fria") || lower.includes("fundamental rights")) {
    return `**Article 27 - Fundamental Rights Impact Assessment (FRIA)**

The FRIA is a mandatory assessment for certain high-risk AI systems deployed by public authorities or private entities in essential services (Art.27).

**When is FRIA required? (Art.27(1))**:
- AI systems deployed by public bodies
- AI systems deployed by private entities for essential services (healthcare, banking, insurance, etc.)
- High-risk AI systems under Annex III

**FRIA must address (Art.27(3))**:
1. **System Description**: Purpose, geographic scope, duration, categories of persons affected
2. **Legal Basis**: Documentation of the legal basis under EU or Member State law
3. **Necessity & Proportionality**: Assessment of whether the system is necessary and proportionate
4. **Fundamental Rights Risks**: Identification of specific risks to rights including:
   - Right to privacy and data protection (GDPR)
   - Non-discrimination (Art.21 Charter)
   - Freedom of expression and information
   - Right to an effective remedy
   - Freedom of assembly and association
   - Right to education
5. **Mitigation Measures**: Technical and organizational measures to address identified risks
6. **Consultation Process**: Documentation of stakeholder consultations

**Deadlines**: FRIA must be completed before deployment and updated when significant changes occur.

**Key Reference**: Art.27, Art.9(2)(b), Recital 60 of the EU AI Act.${context}`;
  }

  if (lower.includes("data") || lower.includes("governance")) {
    return `**Article 10 - Data Governance Requirements**

High-risk AI systems must comply with strict data governance requirements under Art.10:

**Training Data Requirements (Art.10(2))**:
1. **Relevance & Representativeness**: Training datasets must be relevant, sufficiently representative, and free of errors
2. **Data Quality**: Data must be examined for possible biases and corrected where necessary
3. **Completeness**: Datasets must have appropriate statistical properties, including regarding persons belonging to specific groups
4. **Data Preparation**: All steps in data preparation must be documented (collection, cleaning, labeling, etc.)

**Data Governance Practices (Art.10(3))**:
- Datasets must comply with applicable copyright and data protection laws (GDPR)
- Data collection protocols must be documented
- Data provenance and sourcing must be traceable
- Curation and selection criteria must be transparent

**Biometric Data (Art.10(5))**:
- Must comply with specific conditions for biometric data collection
- Requires appropriate data protection impact assessment (DPIA)

**Testing Data (Art.10(4))**:
- Test datasets must be separate from training datasets
- Must be representative of the intended deployment context

**Documentation Requirements**:
- Data sheets for datasets (following EU AI Office guidance)
- Version control for all datasets
- Audit trails for data processing steps

**Key Reference**: Art.10(2)-(5), Art.9, GDPR Art.5, Art.25, Art.35.${context}`;
  }

  if (lower.includes("qms") || lower.includes("quality")) {
    return `**Article 17 - Quality Management System (QMS)**

Providers of high-risk AI systems must establish and maintain a Quality Management System (Art.17):

**Required QMS Components (Art.17(2))**:
1. **Strategy & Policy**: Documented AI compliance strategy and policies
2. **Organizational Structure**: Clear roles and responsibilities for AI compliance
3. **Resource Management**: Adequate resources for compliance activities
4. **Risk Management System**: Art.9-compliant risk management process
5. **Data Governance**: Art.10-compliant data management practices
6. **Technical Documentation**: Art.11-compliant technical documentation
7. **Record Keeping**: Art.12-compliant logging and record keeping
8. **Transparency Obligations**: Art.13-compliant transparency measures
9. **Human Oversight**: Art.14-compliant human oversight mechanisms
10. **Accuracy & Robustness**: Art.15-compliant accuracy standards
11. **Corrective Actions**: Procedures for addressing non-conformities
12. **Post-Market Monitoring**: Art.72-compliant monitoring system
13. **Change Management**: Controlled process for system updates
14. **Incident Reporting**: Art.62-compliant serious incident reporting

**QMS Documentation Must Include**:
- Quality policy and objectives
- Process descriptions and standard operating procedures
- Compliance records and audit trails
- Management review records
- Corrective and preventive action records

**Key Reference**: Art.17(1)-(4), Annex IX of the EU AI Act.${context}`;
  }

  if (lower.includes("transparency")) {
    return `**Articles 13 & 50 - Transparency Obligations**

The EU AI Act imposes transparency obligations on both providers and deployers:

**Provider Obligations (Art.13)**:
1. **Instruction & Information**: Providers must ensure AI systems are designed to enable deployers to comply with transparency obligations
2. **Technical Documentation**: Clear documentation enabling deployers to understand system capabilities and limitations
3. **Declaration of Conformity**: EU declaration of conformity must accompany the system

**Deployer Obligations (Art.50)**:
1. **Chatbot Disclosure (Art.50(1))**: Deployers of AI systems that interact with humans must disclose that the user is interacting with an AI system
2. **Emotion Recognition (Art.50(2))**: Deployers of emotion recognition systems must inform exposed persons
3. **Deepfakes (Art.50(3))**: AI-generated or manipulated content (text, audio, image, video) must be labeled as artificially generated
4. **Biometric Categorization (Art.50(4))**: Deployers must inform persons when biometric categorization is used

**Enforcement Timeline**:
- Art.50 transparency obligations: Effective from February 2, 2025
- Art.13 provider obligations: Effective from August 2, 2025 (for high-risk systems)

**Penalties**: Non-compliance with transparency obligations can result in fines up to EUR 15 million or 3% of global annual turnover.

**Key Reference**: Art.13, Art.50(1)-(4), Art.78 of the EU AI Act.${context}`;
  }

  if (lower.includes("human oversight")) {
    return `**Article 14 - Human Oversight**

High-risk AI systems must be designed to allow effective human oversight during use (Art.14):

**Human Oversight Measures (Art.14(2))**:
1. **Identify & Reduce Risks**: The system must enable oversight to identify and reduce risks
2. **Understand Output**: Users must be able to understand and interpret system outputs
3. **Avoid Over-Reliance**: Design must prevent users from relying too heavily on AI outputs
4. **Detect & Correct**: Ability to detect system errors, failures, or unexpected outputs
5. **Intervene**: Capability to intervene on the operation of the system or interrupt it
6. **Reverse Decisions**: Ability to reverse or override AI decisions

**Oversight Types (Art.14(3))**:
- **Human-in-the-loop**: Human review before each AI decision is executed
- **Human-on-the-loop**: Human monitors AI system during operation and can intervene
- **Human-in-command**: Human authorizes AI system use and can override decisions

**Implementation Guidance**:
- Clear user interfaces showing AI confidence levels
- Alert mechanisms for anomalous outputs
- Logging of all AI decisions and human interventions
- Training programs for human overseers

**Key Reference**: Art.14(1)-(5), Recital 46 of the EU AI Act.${context}`;
  }

  return `**EU AI Act - General Overview**

The EU AI Act (Regulation (EU) 2024/1689) is the world's first comprehensive legal framework for artificial intelligence. It entered into force on August 1, 2024.

**Key Structure**:
- **Art.1-4**: Scope, definitions, and prohibited practices
- **Art.5**: Prohibited AI practices (banned applications)
- **Art.6-49**: High-risk AI system requirements
- **Art.50-56**: Transparency obligations
- **Art.51-56**: General-purpose AI (GPAI) rules
- **Art.57-60**: Governance structure (European AI Office, national authorities)
- **Art.61-77**: Enforcement, penalties, and implementation

**Risk-Based Approach**:
1. **Unacceptable Risk**: Banned under Art.5
2. **High Risk**: Strict requirements under Art.6-15
3. **Limited Risk**: Transparency obligations under Art.50
4. **Minimal Risk**: Voluntary codes of conduct

**Key Deadlines**:
- February 2, 2025: Prohibited practices & transparency obligations apply
- August 2, 2025: High-risk system obligations (Art.6-49) apply
- August 2, 2026: Obligations for certain high-risk AI systems in Annex I
- August 2, 2027: Full enforcement for remaining high-risk systems

**Penalties**: Up to EUR 35 million or 7% of global annual turnover for the most serious violations.

Try asking about specific topics: Art.6 compliance, prohibited practices, FRIA, data governance, QMS, transparency, or human oversight.${context}`;
}

export default function AIAssistantPage() {
  const t = useTranslations();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch AI systems
  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/ai-systems");
        if (res.ok) {
          const data = await res.json();
          setSystems(data.data ?? []);
        }
      } catch {
        // Silently handle fetch errors
      }
    }
    fetchSystems();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const selectedSystemName = systems.find((s) => s.id === selectedSystemId)?.name;

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      // Simulate AI response delay
      setTimeout(() => {
        const response = generateResponse(text, selectedSystemName);
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      }, 800 + Math.random() * 700);
    },
    [selectedSystemName]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t("tools.results")}          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Embedded AI Compliance Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about EU AI Act compliance and get instant guidance with
          relevant article references.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-6">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}        </label>
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
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">{t("tools.results")}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleQuickAction(action)}
              className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="mt-6 rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">{t("tools.results")}</span>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >{t("common.close")}          </button>
        </div>

        {/* Messages */}
        <div className="h-[480px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("tools.searchPlaceholder")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Responses include relevant EU AI Act article references.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "rounded-lg border border-border bg-muted/30"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p
                  className={`mt-1 text-xs ${
                    msg.role === "user"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0.1s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("tools.searchPlaceholder")}
            disabled={isTyping}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >{t("common.submit")}          </button>
        </form>
      </div>
    </div>
  );
}
