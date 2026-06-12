"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";

/**
 * Article data for the Knowledge Base
 */
interface Article {
  id: string;
  title: string;
  category: Category;
  shortDescription: string;
  fullContent: string;
}

type Category =
  | "All"
  | "Risk Classification"
  | "High-Risk AI"
  | "Prohibited Practices"
  | "Transparency"
  | "Fundamental Rights"
  | "Compliance Process"
  | "Enforcement";

const CATEGORIES: Category[] = [
  "All",
  "Risk Classification",
  "High-Risk AI",
  "Prohibited Practices",
  "Transparency",
  "Fundamental Rights",
  "Compliance Process",
  "Enforcement",
];

const CATEGORY_COLORS: Record<Category, string> = {
  All: "bg-muted text-muted-foreground",
  "Risk Classification": "bg-blue-500/10 text-blue-700",
  "High-Risk AI": "bg-red-500/10 text-red-700",
  "Prohibited Practices": "bg-purple-500/10 text-purple-700",
  Transparency: "bg-amber-500/10 text-amber-700",
  "Fundamental Rights": "bg-emerald-500/10 text-emerald-700",
  "Compliance Process": "bg-cyan-500/10 text-cyan-700",
  Enforcement: "bg-orange-500/10 text-orange-700",
};

const ARTICLES: Article[] = [
  {
    id: "risk-categories",
    title: "Understanding AI Risk Categories Under the EU AI Act",
    category: "Risk Classification",
    shortDescription:
      "The EU AI Act establishes a risk-based approach with four tiers: unacceptable, high, limited, and minimal risk. This article breaks down each tier and what it means for your AI systems.",
    fullContent:
      "The EU AI Act classifies AI systems into four risk tiers, each carrying different regulatory obligations:\n\n1. Unacceptable Risk (Art.5): AI practices that pose a clear threat to fundamental rights are banned outright. These include social scoring by governments, real-time remote biometric identification in public spaces (with limited exceptions), and manipulative AI targeting vulnerable groups.\n\n2. High Risk (Art.6): AI systems deployed in critical areas such as employment, education, essential services, law enforcement, and migration. These systems must comply with strict requirements including risk management, data governance, technical documentation, human oversight, and conformity assessments.\n\n3. Limited Risk (Art.50-52): AI systems like chatbots and deepfakes that interact with humans must meet transparency obligations. Users must be informed they are interacting with an AI system, and AI-generated content must be clearly labeled.\n\n4. Minimal Risk: Most AI systems fall into this category with no specific mandatory requirements beyond existing legislation. The EU encourages voluntary codes of conduct for these systems.\n\nUnderstanding where your AI system falls is the first critical step toward compliance. Use our Risk Classification tool to self-assess your system.",
  },
  {
    id: "high-risk-criteria",
    title: "What Counts as a High-Risk AI System",
    category: "High-Risk AI",
    shortDescription:
      "Article 6 of the EU AI Act defines the criteria for high-risk AI systems. This guide explains the two-track assessment: systems listed in Annex III and those meeting the standalone/significant decision criteria.",
    fullContent:
      "Under Article 6, an AI system is classified as high-risk if it falls under either of two tracks:\n\nTrack 1 - Annex III Listing: The AI system is explicitly listed in Annex III, which covers eight categories:\n- Biometric identification and categorization systems\n- Critical infrastructure management (e.g., road traffic, water, gas)\n- General-purpose AI (GPAI) used as high-risk systems\n- Education and vocational training admissions/scoring\n- Employment and worker management\n- Access to essential private and public services\n- Law enforcement (except for prohibited uses)\n- Migration, asylum, and border control\n- Administration of justice and democratic processes\n\nTrack 2 - Significant Decision Criteria: Even if not in Annex III, an AI system is high-risk if it meets all three of the following:\n(a) It is deployed as a safety component of a product covered by EU harmonization legislation\n(b) The product requires a third-party conformity assessment before being placed on the market\n(c) The AI system materially influences the product's safety or the product is explicitly listed in Annex III\n\nHigh-risk AI systems must comply with requirements in Articles 8-15, establish a quality management system (Art.17), and undergo conformity assessment (Art.43). Non-compliance can result in fines up to EUR 35 million or 7% of global annual turnover.",
  },
  {
    id: "prohibited-practices",
    title: "Prohibited AI Practices: Complete Guide",
    category: "Prohibited Practices",
    shortDescription:
      "Article 5 of the EU AI Act establishes a comprehensive list of banned AI practices. This guide covers each prohibited practice, its rationale, and the limited exceptions that apply.",
    fullContent:
      "Article 5 of the EU AI Act prohibits the following AI practices:\n\n1. Subliminal Manipulation: AI systems that deploy subliminal techniques or exploit vulnerabilities of specific groups (age, disability, social/economic situation) to materially distort behavior, leading to decisions with significant harm.\n\n2. Exploitation of Vulnerabilities: AI systems that exploit the vulnerabilities of persons due to their age, disability, or social/economic situation to materially distort behavior in a manner likely to cause significant harm.\n\n3. Social Scoring: AI systems used by public authorities to evaluate or classify individuals based on social behavior, socioeconomic status, or personal characteristics, leading to detrimental treatment unrelated to the original context.\n\n4. Individual Criminal Risk Assessment: AI systems that assess the risk of an individual committing a criminal offense based solely on profiling or personality traits (except when based on verifiable facts connected to criminal activity).\n\n5. Untargeted Facial Image Scraping: Creating or expanding facial recognition databases through untargeted scraping of images from the internet or CCTV footage.\n\n6. Workplace and Education Emotion Recognition: AI systems that infer emotions of natural persons in workplaces and educational institutions (except for specific medical or safety purposes).\n\n7. Predictive Policing: AI systems that make predictions about criminal offenses based solely on profiling, except when based on verifiable data linked to existing criminal activity.\n\n8. Biometric Categorization Using Sensitive Characteristics: AI systems that categorize individuals based on biometric data to infer race, political opinions, trade union membership, religious beliefs, sexual orientation, or other sensitive characteristics.\n\nViolations of Article 5 carry the highest penalties: up to EUR 35 million or 7% of global annual turnover, whichever is higher.",
  },
  {
    id: "technical-documentation",
    title: "Technical Documentation Requirements (Annex IV)",
    category: "Compliance Process",
    shortDescription:
      "Annex IV of the EU AI Act specifies the mandatory technical documentation that high-risk AI systems must include before market placement. This article outlines each required section.",
    fullContent:
      "Annex IV requires high-risk AI system providers to maintain comprehensive technical documentation. The documentation must include:\n\n1. General Description: Name, description, intended purpose, target users, and version of the AI system.\n\n2. Data and Training: Detailed description of training data, validation and testing datasets, including data collection methods, preprocessing, labeling, and any known limitations or gaps.\n\n3. Design and Architecture: System architecture, algorithms used, model cards, key performance metrics, and decisions about trade-offs between accuracy and other requirements.\n\n4. Development Process: Software development lifecycle, quality management measures, testing protocols, and validation strategies.\n\n5. Risk Management: Identification and analysis of known and foreseeable risks, mitigation measures adopted, and residual risk evaluation.\n\n6. Performance Metrics: Accuracy, robustness, cybersecurity measures, and performance across different demographic groups to detect bias.\n\n7. Human Oversight: Description of human oversight measures, including the competence and training required for human operators.\n\n8. Conformity Assessment: Description of the conformity assessment procedure followed, including the role of notified bodies.\n\n9. Post-Market Monitoring: Description of the post-market monitoring plan, including incident reporting mechanisms.\n\n10. User Instructions: Clear instructions for deployers, including intended purpose, level of accuracy, known limitations, and maintenance requirements.\n\nThe technical documentation must be kept up-to-date throughout the lifecycle of the AI system and made available to national competent authorities upon request.",
  },
  {
    id: "fria-guide",
    title: "Fundamental Rights Impact Assessment Guide",
    category: "Fundamental Rights",
    shortDescription:
      "Article 27 mandates Fundamental Rights Impact Assessments (FRIAs) for deployers of high-risk AI systems in certain public-facing contexts. Learn how to conduct a proper FRIA.",
    fullContent:
      "Under Article 27, deployers of high-risk AI systems must conduct a Fundamental Rights Impact Assessment (FRIA) when the system is used by public bodies or in specific private-sector contexts such as:\n- Employment and worker management\n- Access to essential private and public services (banking, insurance, housing)\n- Law enforcement\n- Migration, asylum, and border control\n- Administration of justice\n\nA FRIA must include:\n\n1. System Description: A clear description of the AI system's purposes, context of use, and the categories of affected persons.\n\n2. Mapping Fundamental Rights: Identification of specific fundamental rights that may be impacted, including dignity, privacy, non-discrimination, freedom of expression, and workers' rights.\n\n3. Risk Assessment: Assessment of the likelihood and severity of harm to fundamental rights, considering different groups (children, elderly, persons with disabilities, marginalized communities).\n\n4. Mitigation Measures: Concrete measures to prevent or mitigate identified risks, including technical safeguards, organizational controls, and procedural protections.\n\n5. Governance Framework: Description of the human oversight arrangements, complaint mechanisms, and remediation processes.\n\nFRIAs must be completed before the AI system is put into use and updated when there are significant changes. The results must be submitted to the relevant market surveillance authority upon request. Organizations should document the entire FRIA process and maintain records for at least the lifetime of the AI system deployment.",
  },
  {
    id: "qms",
    title: "Quality Management Systems for AI",
    category: "Compliance Process",
    shortDescription:
      "Article 17 requires providers of high-risk AI systems to establish and maintain a Quality Management System (QMS). This article explains the required components and implementation approach.",
    fullContent:
      "Article 17 mandates that all providers of high-risk AI systems establish, implement, document, and maintain a Quality Management System (QMS). The QMS must include:\n\n1. Strategy and Governance: A clear compliance strategy, organizational structure, roles, and responsibilities for AI compliance. Senior management must be actively involved.\n\n2. Resource Management: Allocation of adequate resources including personnel with appropriate expertise, infrastructure, and tools for compliance activities.\n\n3. Design and Development Controls: Systematic processes for AI system design, development, testing, and validation, including risk management integration at each stage.\n\n4. Data Management: Procedures for data collection, quality assurance, validation, and governance throughout the AI system lifecycle.\n\n5. Documentation and Record-Keeping: Systems for creating, maintaining, and updating all required documentation including technical files, conformity assessments, and post-market monitoring records.\n\n6. Supplier and Subcontractor Management: Processes for evaluating and managing third parties that contribute to the AI system's development or deployment.\n\n7. Corrective Actions: Procedures for identifying, investigating, and correcting non-conformities, including root cause analysis and preventive measures.\n\n8. Post-Market Monitoring: Systems for continuously monitoring the AI system's performance, collecting incident reports, and triggering corrective actions when needed.\n\n9. Change Management: Controlled processes for managing changes to the AI system that could affect its compliance status.\n\n10. Continuous Improvement: Regular review and improvement of the QMS itself, including internal audits and management reviews.\n\nThe QMS documentation must be available to national competent authorities and notified bodies upon request.",
  },
  {
    id: "data-governance",
    title: "Data Governance Best Practices",
    category: "High-Risk AI",
    shortDescription:
      "Article 10 of the EU AI Act sets out data governance requirements for high-risk AI systems. This guide covers training data practices, bias mitigation, and data quality standards.",
    fullContent:
      "Article 10 requires providers of high-risk AI systems to implement robust data governance practices throughout the training, validation, and testing phases:\n\n1. Training Data Quality: Training, validation, and testing datasets must be relevant, representative, free of errors, and complete. Data collection methods must comply with applicable laws including GDPR.\n\n2. Bias and Fairness: Datasets must be examined for possible biases that could affect the system's accuracy or lead to discriminatory outcomes. This includes biases related to protected characteristics such as race, gender, age, and disability.\n\n3. Data Specifications: Providers must document the data specifications including:\n- Description of the datasets and their sources\n- Data collection and preparation methodologies\n- Labeling procedures and quality controls\n- Known limitations and gaps in the data\n\n4. Data Protection Compliance: All data processing must comply with GDPR and other applicable data protection regulations. This includes ensuring lawful bases for processing, data minimization, and purpose limitation.\n\n5. Testing Datasets: Separate validation and testing datasets must be used to evaluate the system's performance. These datasets must be representative of the intended deployment context.\n\n6. Data Updates: Procedures must be in place to update datasets as needed to maintain the AI system's accuracy and reduce bias over time.\n\n7. Third-Party Data: When using third-party data, providers must verify that the data was collected and processed in compliance with applicable laws and that appropriate agreements are in place.\n\nBest practices include maintaining a data lineage registry, implementing automated bias detection tools, conducting regular data quality audits, and establishing clear data governance roles within the organization.",
  },
  {
    id: "human-oversight",
    title: "Human Oversight Requirements",
    category: "High-Risk AI",
    shortDescription:
      "Article 14 of the EU AI Act mandates human oversight for high-risk AI systems. This article explains the types of oversight required, who qualifies as a human overseer, and implementation strategies.",
    fullContent:
      "Article 14 requires that high-risk AI systems be designed to allow effective human oversight during their use. The specific oversight measures depend on the system's risk level, intended purpose, and context of deployment.\n\nRequired Oversight Measures:\n\n1. Human-in-the-Loop (HITL): For the highest-risk applications, a human must review and approve each AI output before it takes effect. This is required for decisions with significant legal or similarly significant effects on individuals.\n\n2. Human-on-the-Loop (HOTL): For other high-risk systems, humans must be able to monitor the AI system's operation in real-time and intervene when necessary. The system must provide clear indicators of its confidence level and decision rationale.\n\n3. Human-in-Command (HIC): At minimum, humans must retain the ability to override, reverse, or deactivate the AI system. The system must not prevent human operators from overriding its decisions.\n\nOverseer Qualifications:\n- Sufficient knowledge and training about the AI system's operation, limitations, and potential risks\n- Authority and ability to override the system's decisions\n- Adequate time and resources to perform oversight effectively\n- Clear understanding of when and how to intervene\n\nImplementation Requirements:\n- Clear user interfaces showing AI system status, confidence levels, and decision factors\n- Built-in mechanisms for human override that are easily accessible\n- Logging of all human interventions and override actions\n- Regular training programs for human overseers\n- Documentation of oversight procedures and escalation paths\n\nOrganizations should establish clear governance structures defining who is responsible for oversight, how decisions are escalated, and how oversight effectiveness is measured and improved over time.",
  },
  {
    id: "post-market-monitoring",
    title: "Post-Market Monitoring Obligations",
    category: "Enforcement",
    shortDescription:
      "Article 72 of the EU AI Act requires providers to establish post-market monitoring systems. Learn about incident reporting, performance tracking, and corrective action requirements.",
    fullContent:
      "Article 72 mandates that providers of high-risk AI systems establish and maintain a systematic post-market monitoring system throughout the system's lifetime:\n\n1. Monitoring Plan: Providers must develop a documented post-market monitoring plan that specifies:\n- Key performance indicators (KPIs) and metrics to be tracked\n- Methods for collecting and analyzing performance data\n- Frequency of monitoring activities\n- Thresholds that trigger corrective actions\n\n2. Incident Reporting: Providers must report serious incidents to the relevant market surveillance authority within 15 days of becoming aware of the incident. A serious incident is one that directly or indirectly leads to:\n- Death or serious personal injury\n- Significant disruption of critical infrastructure\n- Serious violation of fundamental rights\n\n3. Performance Tracking: Continuous monitoring of the AI system's performance in real-world conditions, including:\n- Accuracy and reliability metrics\n- Bias and fairness indicators\n- User feedback and complaints\n- System failures and errors\n\n4. Corrective Actions: When monitoring reveals issues, providers must:\n- Investigate the root cause\n- Implement corrective measures (updates, patches, or system modifications)\n- Notify affected deployers and users\n- Update technical documentation and conformity assessment\n- Report corrective actions to market surveillance authorities\n\n5. Record Keeping: All post-market monitoring data, including incident reports, corrective actions, and performance metrics, must be documented and retained for at least the lifetime of the AI system.\n\n6. Deployer Cooperation: Deployers must cooperate with providers by reporting observed incidents, sharing relevant usage data, and implementing provider-issued updates or corrective actions.",
  },
  {
    id: "conformity-assessment",
    title: "Conformity Assessment Procedures",
    category: "Compliance Process",
    shortDescription:
      "Article 43 outlines the conformity assessment procedures required before placing high-risk AI systems on the EU market. This guide covers self-assessment, third-party assessment, and the CE marking process.",
    fullContent:
      "Article 43 establishes the conformity assessment procedures that high-risk AI system providers must complete before placing their systems on the EU market:\n\nProcedure Options:\n\n1. Internal Control (Self-Assessment): For most high-risk AI systems, providers can perform an internal conformity assessment. This involves:\n- Completing the technical documentation (Annex IV)\n- Implementing the quality management system (Art.17)\n- Ensuring compliance with all applicable requirements (Arts.8-15)\n- Drafting an EU declaration of conformity\n\n2. Third-Party Assessment with Notified Body: For certain high-risk AI systems (e.g., biometric identification, critical infrastructure), an independent notified body must be involved in the conformity assessment. This includes:\n- Review of technical documentation\n- Assessment of the QMS\n- Evaluation of the AI system's design and development process\n- Ongoing surveillance after market placement\n\nCE Marking:\n- Upon successful conformity assessment, providers must affix the CE marking to the AI system\n- The CE marking indicates compliance with the EU AI Act and other applicable EU legislation\n- CE marking must be accompanied by the EU declaration of conformity\n\nDocumentation Requirements:\n- EU Declaration of Conformity (Annex VI)\n- Technical documentation (Annex IV)\n- Registration in the EU AI Database\n- Instructions for use\n- Proof of conformity assessment completion\n\nProviders must keep conformity assessment documentation available for 10 years after the AI system has been placed on the market or put into service.",
  },
  {
    id: "penalties-enforcement",
    title: "Penalties and Enforcement Timeline",
    category: "Enforcement",
    shortDescription:
      "The EU AI Act establishes significant penalties for non-compliance and a phased enforcement timeline. This article covers the fine structure, enforcement deadlines, and key milestones.",
    fullContent:
      "The EU AI Act introduces a robust enforcement regime with substantial penalties and a phased implementation timeline:\n\nPenalty Structure:\n\n1. Prohibited Practices (Art.5): Up to EUR 35 million or 7% of global annual turnover, whichever is higher.\n\n2. High-Risk AI Non-Compliance: Up to EUR 15 million or 3% of global annual turnover, whichever is higher.\n\n3. Incorrect Information to Authorities: Up to EUR 7.5 million or 1% of global annual turnover, whichever is higher.\n\n4. Minor Non-Compliance: Administrative fines proportional to the severity and duration of the infringement.\n\nEnforcement Timeline:\n\n- February 2, 2025: Prohibited practices (Art.5) and AI literacy obligations (Art.4) enter into application.\n\n- August 2, 2025: General-purpose AI (GPAI) rules, including obligations for GPAI models with systemic risk, become applicable.\n\n- August 2, 2026: Most high-risk AI system rules become applicable, including requirements for quality management, technical documentation, data governance, and conformity assessment.\n\n- August 2, 2027: Obligations for certain high-risk AI systems in Annex I become applicable.\n\nEnforcement Authorities:\n- Each EU member state must designate at least one national competent authority\n- The European AI Office coordinates enforcement across member states\n- Market surveillance authorities have powers to investigate, request documentation, restrict or withdraw non-compliant AI systems from the market\n- Individuals can lodge complaints with national authorities\n\nOrganizations should begin compliance preparations well in advance of the applicable deadlines, as many requirements (such as QMS establishment and technical documentation) require significant lead time.",
  },
  {
    id: "ai-literacy",
    title: "AI Literacy Requirements",
    category: "Transparency",
    shortDescription:
      "Article 4 of the EU AI Act introduces AI literacy obligations for providers, deployers, and other actors in the AI value chain. This guide explains who must ensure AI literacy and what it entails.",
    fullContent:
      "Article 4 requires that all parties involved in the AI value chain take measures to ensure a sufficient level of AI literacy:\n\nWho Must Ensure AI Literacy:\n\n1. Providers: Organizations that develop and place AI systems on the market must ensure their staff understand the AI systems they develop, including their capabilities, limitations, and potential risks.\n\n2. Deployers: Organizations that use AI systems under their authority must ensure their staff understand how to properly use, monitor, and oversee the AI systems they deploy.\n\n3. Importers and Distributors: Parties that make AI systems available in the EU market must understand the compliance status and proper use of the systems they handle.\n\nWhat AI Literacy Includes:\n\n- Understanding of AI system capabilities and limitations\n- Knowledge of the relevant regulatory requirements\n- Ability to interpret AI system outputs correctly\n- Awareness of potential risks and biases\n- Skills to implement human oversight effectively\n- Knowledge of incident reporting procedures\n- Understanding of data protection requirements\n\nImplementation Approaches:\n\n1. Training Programs: Regular training sessions tailored to different roles and levels of AI interaction.\n\n2. Documentation and Guidelines: Clear, accessible documentation about AI systems and their proper use.\n\n3. Competency Frameworks: Defined skill requirements for different roles involving AI systems.\n\n4. Continuous Education: Ongoing education programs that keep pace with evolving AI technologies and regulations.\n\n5. Awareness Campaigns: Organization-wide initiatives to raise awareness about AI opportunities and risks.\n\nAI literacy is one of the first obligations to take effect (February 2, 2025), making it an immediate priority for all organizations operating AI systems in the EU market.",
  },
];

/**
 * Knowledge Base page - EU AI Act information and articles
 */
export default function KnowledgeBasePage() {
  const t = useTranslations();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    null
  );

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.shortDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        article.fullContent.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const toggleExpand = (id: string) => {
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprehensive guides and articles on EU AI Act compliance, risk
          classification, and regulatory requirements.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mt-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Article Count */}
      <div className="mt-6">
        <p className="text-xs text-muted-foreground">
          {filteredArticles.length}{" "}
          {filteredArticles.length === 1 ? "article" : "articles"} found
        </p>
      </div>

      {/* Article Cards */}
      <div className="mt-4 flex flex-col gap-4">
        {filteredArticles.length === 0 ? (
          <div className="rounded-lg border border-border bg-background px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t("tools.noResults")}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              {t("tools.clearFilters")}
            </button>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <article
              key={article.id}
              className="rounded-lg border border-border bg-background transition-colors hover:border-primary/30"
            >
              <div className="p-5">
                {/* Category Badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[article.category]}`}
                >
                  {article.category}
                </span>

                {/* Title */}
                <h3 className="mt-3 text-sm font-semibold leading-snug">
                  {article.title}
                </h3>

                {/* Short Description */}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {article.shortDescription}
                </p>

                {/* Read More / Read Less Toggle */}
                <button
                  onClick={() => toggleExpand(article.id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {expandedArticleId === article.id
                    ? "Read less"
                    : "Read more"}
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${
                      expandedArticleId === article.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Expanded Content */}
                {expandedArticleId === article.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                      {article.fullContent}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
