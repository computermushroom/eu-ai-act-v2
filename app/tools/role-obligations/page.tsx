// Role-Based Compliance Obligations Tool
// Client Component: displays EU AI Act obligations per role (Provider, Deployer, Distributor, Importer)
// Fetches AI systems from /api/ai-systems, tracks progress per role, generates role report

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISystem {
  id: string;
  name: string;
  riskLevel: string;
  status: string;
}

type RoleKey = "provider" | "deployer" | "distributor" | "importer";

interface Obligation {
  id: string;
  article: string;
  title: string;
  description: string;
  details: string;
}

interface RoleConfig {
  key: RoleKey;
  label: string;
  subtitle: string;
  obligations: Obligation[];
}

// ---------------------------------------------------------------------------
// Obligation data per role
// ---------------------------------------------------------------------------

const ROLES: RoleConfig[] = [
  {
    key: "provider",
    label: "Provider (Manufacturer)",
    subtitle:
      "Obligations for entities that develop and place AI systems on the market under their own name or trademark",
    obligations: [
      {
        id: "prov-art9",
        article: "Art. 9",
        title: "Risk Management System",
        description:
          "Establish, implement, document, and maintain a continuous risk management system throughout the entire lifecycle of the high-risk AI system.",
        details:
          "The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system. It shall comprise systematic identification, analysis, and evaluation of known and reasonably foreseeable risks. Risks shall be mitigated by design and development, and through appropriate technical and organizational measures. The risk management system shall include regular updating, documented change management, and a mechanism for capturing and analysing incidents.",
      },
      {
        id: "prov-art10",
        article: "Art. 10",
        title: "Data and Data Governance",
        description:
          "Ensure training, validation, and testing datasets are relevant, representative, free of errors, and complete. Apply data governance and management practices.",
        details:
          "Training, validation and testing data sets shall be subject to data governance and management practices appropriate for the intended purpose. Data sets shall be examined for possible biases, and appropriate mitigating measures taken. Data sets shall have relevant design choices, collection processes, and preparation processes documented. Data sets shall be relevant, sufficiently representative, and to the best extent possible, free of errors and complete.",
      },
      {
        id: "prov-art11",
        article: "Art. 11",
        title: "Technical Documentation",
        description:
          "Draw up and maintain up-to-date technical documentation for the high-risk AI system before placing it on the market or putting it into service.",
        details:
          "The technical documentation shall be drawn up before the high-risk AI system is placed on the market or put into service and shall be kept up-to-date. It shall allow competent authorities to assess the compliance of the system. The documentation shall include a general description, a detailed description of the system design and architecture, and information on data requirements, training processes, validation and testing, performance metrics, and intended purpose.",
      },
      {
        id: "prov-art12",
        article: "Art. 12",
        title: "Record-Keeping (Automatic Logging)",
        description:
          "Design the high-risk AI system to enable automatic logging of events relevant to identifying high-risk situations and significant incidents.",
        details:
          "High-risk AI systems shall be designed and developed in such a way that they ensure an appropriate level of traceability. In particular, logging capabilities shall enable the recording of events relevant to identifying high-risk situations, including at minimum: the system's operation, inputs and outputs, and any other data or information required for post-market monitoring. Logs shall be kept for an appropriate period that is proportionate to the intended purpose and the applicable legal retention requirements.",
      },
      {
        id: "prov-art13",
        article: "Art. 13",
        title: "Transparency and Provision of Information to Deployers",
        description:
          "Ensure high-risk AI systems are designed and developed with transparency so deployers can interpret output and use the system appropriately.",
        details:
          "High-risk AI systems shall be designed and developed in such a way as to ensure that their operation is sufficiently transparent to enable deployers to interpret the system's output and use it appropriately. Providers shall provide deployers with clear instructions for use, including information about: the system's characteristics, capabilities, limitations, intended purpose, level of accuracy, and the conditions for use. Instructions shall also include information on how to interpret the output correctly and the circumstances that may lead to risks.",
      },
      {
        id: "prov-art14",
        article: "Art. 14",
        title: "Human Oversight",
        description:
          "Design high-risk AI systems to enable effective human oversight during the period of use, including by natural persons.",
        details:
          "High-risk AI systems shall be designed and developed in such a way, including with appropriate human-machine interface tools, that they can be effectively overseen by natural persons during the period in which the AI system is in use. The oversight measures shall enable individuals to fully understand the system's capacities and limitations, monitor its operation, interpret the output, decide not to use the system or to override or reverse its output, and intervene on the operation or interrupt the system through a 'stop' button or similar procedure.",
      },
      {
        id: "prov-art15",
        article: "Art. 15",
        title: "Accuracy, Robustness, and Cybersecurity",
        description:
          "Achieve appropriate levels of accuracy, robustness, and cybersecurity throughout the system lifecycle, with performance metrics and resilience measures.",
        details:
          "High-risk AI systems shall achieve, in the light of their intended purpose, an appropriate level of accuracy, robustness, and cybersecurity. The levels of accuracy and robustness shall be specified, assessed, and documented. Providers shall establish and document performance metrics, and take appropriate measures for the resilience of the system against errors, faults, inconsistencies, and unexpected situations. Cybersecurity protections shall be appropriate to the intended purpose and the risks involved.",
      },
      {
        id: "prov-art16",
        article: "Art. 16",
        title: "Corrective Actions",
        description:
          "Take necessary corrective actions if the AI system does not comply with requirements, including withdrawal, recall, or provision of updates.",
        details:
          "Where a provider becomes aware that a high-risk AI system it has placed on the market or put into service does not comply with the requirements of this Regulation, it shall immediately take the necessary corrective actions to bring the AI system into compliance, to withdraw it, or to recall it, as appropriate. Where the risks associated with the AI system are sufficiently high, providers shall immediately inform the competent national authorities and, where applicable, the notified body.",
      },
      {
        id: "prov-art17",
        article: "Art. 17",
        title: "Quality Management System",
        description:
          "Establish, implement, document, and maintain a quality management system for the high-risk AI system covering all relevant aspects.",
        details:
          "Providers of high-risk AI systems shall establish, implement, document, and maintain a quality management system. The quality management system shall cover: a) a quality strategy and policy; b) procedures for design, development, testing, and validation; c) quality control and quality assurance techniques; d) management of documentation and records; e) resource management; f) post-market monitoring; g) corrective actions and handling of non-conformities; h) communication with competent authorities and notified bodies; i) procedures for handling complaints; j) qualification and training of personnel.",
      },
      {
        id: "prov-art43",
        article: "Art. 43",
        title: "Conformity Assessment",
        description:
          "Ensure the AI system undergoes an appropriate conformity assessment procedure before being placed on the market or put into service.",
        details:
          "Before being placed on the market or put into service, high-risk AI systems shall undergo the relevant conformity assessment procedure in accordance with this Regulation. Providers shall choose one of the following: assessment by a notified body (Annex VII), or assessment based on internal checks followed by application for EU declaration of conformity. The conformity assessment shall verify that the system meets all applicable requirements, including risk management, data governance, technical documentation, record-keeping, transparency, human oversight, accuracy, robustness, and cybersecurity.",
      },
      {
        id: "prov-art47",
        article: "Art. 47",
        title: "EU Declaration of Conformity",
        description:
          "Draw up an EU declaration of conformity before placing the high-risk AI system on the market, affirming compliance with all applicable requirements.",
        details:
          "Providers shall draw up an EU declaration of conformity for each high-risk AI system before it is placed on the market or put into service. The declaration shall indicate: the name and address of the provider; a description and identification of the AI system; confirmation that the system complies with all applicable requirements; references to relevant harmonised standards or common specifications; where applicable, the name and identification number of the notified body; and the date of the declaration. The declaration shall be translated into the language(s) required by the Member State.",
      },
      {
        id: "prov-art49",
        article: "Art. 49",
        title: "Registration in the EU Database",
        description:
          "Register the high-risk AI system in the EU database established under Article 71 before placing it on the market or putting it into service.",
        details:
          "Before placing on the market or putting into service a high-risk AI system, providers shall register that system in the European database. The registration shall include: the name and contact details of the provider; a description of the AI system and its intended purpose; the risk classification and risk management measures; information on the conformity assessment; and any CE marking documentation. The database shall be publicly accessible for certain information and restricted for confidential information.",
      },
      {
        id: "prov-art61",
        article: "Art. 61",
        title: "Post-Market Monitoring",
        description:
          "Establish and maintain a systematic post-market monitoring system to collect, document, and analyse relevant data throughout the lifetime of the AI system.",
        details:
          "Providers shall establish and maintain a systematic post-market monitoring system that is proportionate to the nature of the AI system, the risks involved, and the intended purpose. The system shall actively and systematically collect, document, and analyse relevant data from the use of the high-risk AI system throughout its lifetime. Providers shall evaluate the results of the post-market monitoring to determine whether any corrective action is needed, and shall report significant findings to the competent authorities.",
      },
      {
        id: "prov-art62",
        article: "Art. 62",
        title: "Reporting of Serious Incidents",
        description:
          "Report serious incidents and incidents that constitute a breach of fundamental rights to the market surveillance authorities without undue delay.",
        details:
          "Providers of high-risk AI systems placed on the market or put into service shall report any serious incident to the market surveillance authorities of the Member States where the incident occurred without undue delay and not later than 15 days after becoming aware of the incident. The report shall include: identification of the provider; a description of the incident; the AI system involved; the number and severity of injuries or damage; and corrective actions taken or planned. Incidents involving a breach of fundamental rights shall also be reported.",
      },
      {
        id: "prov-art71",
        article: "Art. 71",
        title: "Market Surveillance",
        description:
          "Cooperate with market surveillance authorities and provide them with all information and documentation necessary to assess compliance.",
        details:
          "Providers shall cooperate with market surveillance authorities and provide them with all the information and documentation necessary to demonstrate the conformity of the high-risk AI system. Upon reasoned request, providers shall make available all documentation, data, and information in a language determined by the authority. Providers shall allow authorities to conduct physical or remote checks on the AI system, including sampling and testing, and shall participate in any corrective action required.",
      },
      {
        id: "prov-art72",
        article: "Art. 72",
        title: "Cooperation with Competent Authorities",
        description:
          "Provide competent authorities with all information and assistance necessary to assess and ensure compliance of the AI system.",
        details:
          "Providers shall provide a competent authority, upon a reasoned request, with all the information and documentation necessary to demonstrate the conformity of the high-risk AI system with the requirements set out in this Regulation, including access to the logs automatically generated by the high-risk AI system. The authority shall have the right to request a demonstration of the AI system operating under the conditions of use specified in the instructions for use.",
      },
      {
        id: "prov-art73",
        article: "Art. 73",
        title: "Incident Reporting Obligations",
        description:
          "Report incidents and breaches of obligations to market surveillance authorities, including details of corrective actions taken or planned.",
        details:
          "Any provider who becomes aware of a serious incident or of a breach of obligations under this Regulation shall report it to the market surveillance authorities. The report shall include: the identification of the provider and the AI system; a description of the incident or breach; the number and severity of any injuries or damage; the corrective actions taken or planned; and any other relevant information. Providers shall also inform notified bodies of any serious incidents.",
      },
    ],
  },
  {
    key: "deployer",
    label: "Deployer (User)",
    subtitle:
      "Obligations for entities that use an AI system under their authority, except for personal non-professional use",
    obligations: [
      {
        id: "dep-art26",
        article: "Art. 26",
        title: "Deployer Obligations for High-Risk AI Systems",
        description:
          "Take appropriate technical and organisational measures to use high-risk AI systems in accordance with the instructions for use.",
        details:
          "Deployers of high-risk AI systems shall: a) use the system in accordance with the instructions for use; b) ensure that the persons assigned to use the system have the necessary competence, training, and authority; c) implement appropriate technical and organisational measures to oversee the system's operation; d) monitor the operation of the system and identify anomalies, dysfunctions, or unexpected performance; e) keep logs automatically generated by the system for an appropriate period; f) inform workers' representatives and affected workers about the use of the system; and g) conduct a fundamental rights impact assessment where required.",
      },
      {
        id: "dep-art27",
        article: "Art. 27",
        title: "Fundamental Rights Impact Assessment (FRIA)",
        description:
          "Carry out a FRIA before first putting a high-risk AI system into use when it is used in specific contexts such as employment, education, or public services.",
        details:
          "Deployers shall carry out a fundamental rights impact assessment before putting into use a high-risk AI system listed in Annex III, where the system is used by deployers in: a) the public sector; b) private entities for the purpose of making decisions about the recruitment, evaluation, promotion, or termination of employment relationships; c) private entities for the purpose of making decisions about access to education or vocational training; d) private entities for the purpose of making decisions about essential private and public services; e) law enforcement; or f) migration, asylum, and border control. The FRIA shall include: a description of the processes, a mapping of fundamental rights risks, measures to mitigate those risks, and a system for monitoring the operation of the AI system.",
      },
      {
        id: "dep-art29",
        article: "Art. 29",
        title: "Supervisory Notification",
        description:
          "Notify the market surveillance authority and, where applicable, the national authority before first putting a high-risk AI system into use in certain public-facing contexts.",
        details:
          "Deployers who are public bodies or private entities providing public services shall, before putting into use a high-risk AI system listed in Annex III, notify the market surveillance authority and, where applicable, the relevant national authority. The notification shall include: the name and contact details of the deployer; a description of the AI system and its intended purpose; the results of the fundamental rights impact assessment; and the measures taken to ensure compliance. The notification shall be updated when significant changes are made to the system or its use.",
      },
      {
        id: "dep-art50",
        article: "Art. 50",
        title: "Transparency Obligations for Deployers",
        description:
          "Inform affected persons when they are interacting with or being subject to decisions by an AI system, including disclosure requirements.",
        details:
          "Deployers of AI systems that interact directly with natural persons, generate content, or make decisions affecting individuals shall ensure that affected persons are informed that they are interacting with an AI system. Deployers shall also inform affected persons about the main characteristics and capabilities of the AI system, the purpose and context of its use, and any decisions made by the system that may significantly affect them. Where an AI system is used to make or assist in making decisions about individuals, deployers shall inform those individuals about the use of the system and the logic involved.",
      },
      {
        id: "dep-art72",
        article: "Art. 72",
        title: "Cooperation with Competent Authorities",
        description:
          "Cooperate with competent authorities and provide all information and documentation necessary to assess the use of the AI system.",
        details:
          "Deployers shall cooperate with competent authorities upon a reasoned request and provide them with all the information and documentation necessary to assess the compliance of the AI system's use. This includes information about how the deployer is using the system, the context of use, the results of any fundamental rights impact assessment, and the measures taken to ensure compliance with the instructions for use. Deployers shall also make available logs and other data generated during the use of the system.",
      },
    ],
  },
  {
    key: "distributor",
    label: "Distributor",
    subtitle:
      "Obligations for entities that make an AI system available on the market without affecting its characteristics",
    obligations: [
      {
        id: "dist-art25",
        article: "Art. 25",
        title: "Distributor Obligations",
        description:
          "Verify that the AI system bears the required CE conformity marking, is accompanied by the required instructions for use, and complies with applicable requirements.",
        details:
          "Distributors shall: a) verify that the high-risk AI system bears the required CE conformity marking and is accompanied by the EU declaration of conformity and the instructions for use; b) ensure that, while under their responsibility, the storage or transport conditions do not jeopardise the compliance of the AI system; c) inform the provider, the importer, and the market surveillance authorities when they consider or have reason to consider that the AI system is not in conformity with the requirements of this Regulation; d) ensure that, where the AI system presents a risk, corrective actions are taken, such as withdrawal or recall; and e) upon a reasoned request from a market surveillance authority, provide all information and documentation necessary to demonstrate the conformity of the AI system.",
      },
      {
        id: "dist-art72",
        article: "Art. 72",
        title: "Cooperation with Competent Authorities",
        description:
          "Cooperate with market surveillance authorities and provide all information and documentation necessary to assess compliance of the distributed AI system.",
        details:
          "Distributors shall cooperate with competent authorities and, upon a reasoned request, provide them with all the information and documentation necessary to demonstrate the conformity of the AI system. This includes information about the supply chain, the identity of the provider and importer, and any actions taken to address non-conformities. Distributors shall allow authorities to access and examine the AI system, and shall participate in any corrective actions required by the authorities.",
      },
    ],
  },
  {
    key: "importer",
    label: "Importer",
    subtitle:
      "Obligations for entities that make an AI system available on the EU market from a third country under their name or trademark",
    obligations: [
      {
        id: "imp-art24",
        article: "Art. 24",
        title: "Importer Obligations",
        description:
          "Ensure the AI system placed on the EU market complies with EU AI Act requirements, including conformity assessment, CE marking, and proper documentation.",
        details:
          "Importers shall: a) ensure that the high-risk AI system has undergone an appropriate conformity assessment procedure; b) ensure that the provider has drawn up the technical documentation and the EU declaration of conformity; c) affix their name, registered trade name, or registered trade mark and the contact address on the AI system; d) ensure that the AI system is accompanied by the instructions for use in a language determined by the Member State; e) ensure that, while under their responsibility, the storage or transport conditions do not jeopardise compliance; f) keep a register of complaints, non-conformities, and recalls; g) inform the provider and the market surveillance authorities when they consider the AI system is not in conformity; and h) cooperate with market surveillance authorities.",
      },
      {
        id: "imp-art72",
        article: "Art. 72",
        title: "Cooperation with Competent Authorities",
        description:
          "Cooperate with market surveillance authorities and provide all information and documentation necessary to assess compliance of the imported AI system.",
        details:
          "Importers shall cooperate with competent authorities and, upon a reasoned request, provide them with all the information and documentation necessary to demonstrate the conformity of the AI system. This includes the results of the conformity assessment, technical documentation, and any correspondence with the provider regarding compliance issues. Importers shall allow authorities to access and examine the AI system, and shall participate in any corrective actions required.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoleObligationsPage() {
  const t = useTranslations();

  // System selector state
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [isLoadingSystems, setIsLoadingSystems] = useState(true);

  // Role selector state
  const [selectedRole, setSelectedRole] = useState<RoleKey>("provider");

  // Checked obligations per role: Record<role, Set<obligationId>>
  const [checked, setChecked] = useState<Record<RoleKey, Set<string>>>({
    provider: new Set(),
    deployer: new Set(),
    distributor: new Set(),
    importer: new Set(),
  });

  // Expanded obligation details
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // ---- Fetch AI systems ----
  const fetchSystems = useCallback(async () => {
    setIsLoadingSystems(true);
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch {
      // Silently fail — systems are optional
    } finally {
      setIsLoadingSystems(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // ---- Toggle helpers ----
  const toggleCheck = useCallback(
    (roleId: RoleKey, obligationId: string) => {
      setChecked((prev) => {
        const next = new Set(prev[roleId]);
        if (next.has(obligationId)) {
          next.delete(obligationId);
        } else {
          next.add(obligationId);
        }
        return { ...prev, [roleId]: next };
      });
    },
    []
  );

  const toggleExpand = useCallback((obligationId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(obligationId)) {
        next.delete(obligationId);
      } else {
        next.add(obligationId);
      }
      return next;
    });
  }, []);

  // ---- Progress calculation ----
  const currentRoleConfig = useMemo(
    () => ROLES.find((r) => r.key === selectedRole) ?? ROLES[0]!,
    [selectedRole]
  );

  const progress = useMemo(() => {
    const total = currentRoleConfig.obligations.length;
    const done = checked[selectedRole].size;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [selectedRole, currentRoleConfig, checked]);

  const overallProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const role of ROLES) {
      total += role.obligations.length;
      done += checked[role.key].size;
    }
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [checked]);

  // ---- Generate report ----
  const handleGenerateReport = useCallback(() => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setReportGenerated(true);
    }, 1500);
  }, []);

  // ---- Role badge colours ----
  const roleBadgeColor: Record<RoleKey, string> = {
    provider: "bg-primary/10 text-primary",
    deployer: "bg-accent/10 text-accent",
    distributor: "bg-orange-500/10 text-orange-600",
    importer: "bg-purple-500/10 text-purple-600",
  };

  const roleIcon: Record<RoleKey, string> = {
    provider: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
    deployer: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0",
    distributor: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.998 2.998 0 002.25 1.016 2.993 2.993 0 002.25-1.016m0 0a2.993 2.993 0 012.25 1.016 2.993 2.993 0 002.25-1.016m0 0a2.993 2.993 0 012.25 1.016 2.998 2.998 0 002.25-1.016",
    importer: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Role-Based Compliance Obligations</h1>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-600">{t("tools.results")}            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track EU AI Act obligations by role: Provider, Deployer, Distributor,
            and Importer
          </p>
        </div>
      </div>

      {/* System Selector */}
      <div className="mt-6 rounded-lg border border-border bg-background p-5">
        <label
          htmlFor="system-select"
          className="block text-sm font-medium text-foreground"
        >{t("tools.selectSystem")}        </label>
        <select
          id="system-select"
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">{t("tools.selectSystem")}</option>
          {isLoadingSystems ? (
            <option disabled>{t("common.loading")}</option>
          ) : (
            systems.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.name}{" "}
                {sys.riskLevel ? `(${sys.riskLevel.charAt(0).toUpperCase() + sys.riskLevel.slice(1)} Risk)` : ""}
              </option>
            ))
          )}
        </select>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Select an AI system to scope the obligations, or leave empty to
          review all obligations.
        </p>
      </div>

      {/* Role Selector */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">{t("tools.status")}        </label>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => {
            const isActive = selectedRole === role.key;
            const roleProgress =
              role.obligations.length === 0
                ? 0
                : Math.round(
                    (checked[role.key].size / role.obligations.length) * 100
                  );
            return (
              <button
                key={role.key}
                onClick={() => setSelectedRole(role.key)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-muted/30"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeColor[role.key]}`}
                  >
                    {role.key === "provider"
                      ? "Provider"
                      : role.key === "deployer"
                        ? "Deployer"
                        : role.key === "distributor"
                          ? "Distributor"
                          : "Importer"}
                  </span>
                  <svg
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={roleIcon[role.key]}
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm font-semibold">{role.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {role.obligations.length} obligations
                </p>
                {/* Mini progress bar */}
                <div className="mt-2 w-full">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{roleProgress}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${roleProgress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("tools.results")}</p>
            <p className="text-xs text-muted-foreground">
              Across all roles:{" "}
              {ROLES.reduce((acc, r) => acc + checked[r.key].size, 0)} of{" "}
              {ROLES.reduce((acc, r) => acc + r.obligations.length, 0)}{" "}
              obligations addressed
            </p>
          </div>
          <span className="text-lg font-bold">{overallProgress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-accent transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Current Role Progress */}
      <div className="mt-4 rounded-lg border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {currentRoleConfig.label} Progress
            </p>
            <p className="text-xs text-muted-foreground">
              {checked[selectedRole].size} of{" "}
              {currentRoleConfig.obligations.length} obligations addressed
            </p>
          </div>
          <span className="text-lg font-bold">{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Role subtitle */}
      <p className="mt-4 text-sm text-muted-foreground">
        {currentRoleConfig.subtitle}
      </p>

      {/* Obligations List */}
      <div className="mt-4 space-y-3">
        {currentRoleConfig.obligations.map((obligation) => {
          const isChecked = checked[selectedRole].has(obligation.id);
          const isExpanded = expanded.has(obligation.id);

          return (
            <div
              key={obligation.id}
              className={`rounded-lg border bg-background transition-colors ${
                isChecked
                  ? "border-accent/40 bg-accent/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(selectedRole, obligation.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  aria-label={`Mark "${obligation.title}" as addressed`}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {obligation.article}
                    </span>
                    <h3 className="text-sm font-semibold">{obligation.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {obligation.description}
                  </p>

                  {/* Expand / Collapse toggle */}
                  <button
                    onClick={() => toggleExpand(obligation.id)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {isExpanded ? "Hide details" : "Show details"}
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${
                        isExpanded ? "rotate-180" : ""
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

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {obligation.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Report */}
      <div className="mt-8 rounded-lg border border-border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">{t("tools.generate")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create a comprehensive compliance report for the selected role
              with all obligation statuses and detailed analysis.
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              "Generate Role Report"
            )}
          </button>
        </div>

        {/* Report generated confirmation */}
        {reportGenerated && (
          <div className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-3">
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
              <p className="text-sm text-accent">
                {t("tools.saved")}.{" "}
                {ROLES.reduce((acc, r) => acc + r.obligations.length, 0)}{" "}
                obligations across {ROLES.length} roles.{" "}
                {ROLES.reduce((acc, r) => acc + checked[r.key].size, 0)} of{" "}
                {ROLES.reduce((acc, r) => acc + r.obligations.length, 0)}{" "}
                obligations have been marked as addressed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          This tool provides guidance based on the EU AI Act (Regulation (EU)
          2024/1689). It is not legal advice. Consult with qualified legal
          counsel for specific compliance determinations. Obligations may vary
          depending on the AI system&apos;s risk classification, intended use,
          and the Member State of deployment.
        </p>
      </div>
    </div>
  );
}
