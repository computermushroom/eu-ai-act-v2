// Documentation Generator Tool - EU AI Act Compliance Document Generation
// Client Component: document type selector, template editor, and document management
// Professional+ tier feature

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AISystem {
  id: string;
  name: string;
}

interface ComplianceDocument {
  id: string;
  title: string;
  type: string;
  version: number;
  status: string;
  createdAt: string;
}

type DocumentType =
  | "technical"
  | "conformity"
  | "post-market"
  | "user-instructions"
  | "fria"
  | "qms";

interface DocumentTypeOption {
  value: DocumentType;
  label: string;
  articleRef: string;
  description: string;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    value: "technical",
    label: "Technical Documentation",
    articleRef: "Art.11 / Annex IV",
    description: "Comprehensive technical documentation demonstrating compliance with high-risk AI system requirements.",
  },
  {
    value: "conformity",
    label: "Conformity Declaration",
    articleRef: "Art.47",
    description: "EU Declaration of Conformity for high-risk AI systems placed on the market or put into service.",
  },
  {
    value: "post-market",
    label: "Post-Market Monitoring Plan",
    articleRef: "Art.72",
    description: "Systematic plan for collecting and reviewing performance data after the AI system is placed on the market.",
  },
  {
    value: "user-instructions",
    label: "User Instructions",
    articleRef: "Art.13",
    description: "Instructions for use enabling deployers to interpret system output and use it appropriately.",
  },
  {
    value: "fria",
    label: "FRIA Report",
    articleRef: "Art.27",
    description: "Fundamental Rights Impact Assessment report for public entity AI systems with specific risk profiles.",
  },
  {
    value: "qms",
    label: "QMS Report",
    articleRef: "Art.17",
    description: "Quality Management System compliance report documenting organizational measures and processes.",
  },
];

function getDocumentTypeBadge(type: string): { bg: string; text: string } {
  switch (type) {
    case "technical":
      return { bg: "bg-blue-500/10", text: "text-blue-600" };
    case "conformity":
      return { bg: "bg-green-500/10", text: "text-green-600" };
    case "post-market":
      return { bg: "bg-purple-500/10", text: "text-purple-600" };
    case "user-instructions":
      return { bg: "bg-amber-500/10", text: "text-amber-600" };
    case "fria":
      return { bg: "bg-rose-500/10", text: "text-rose-600" };
    case "qms":
      return { bg: "bg-cyan-500/10", text: "text-cyan-600" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

function getStatusBadge(status: string): { bg: string; text: string } {
  switch (status) {
    case "draft":
      return { bg: "bg-orange-500/10", text: "text-orange-600" };
    case "final":
      return { bg: "bg-accent/10", text: "text-accent" };
    case "archived":
      return { bg: "bg-muted", text: "text-muted-foreground" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

function generateTitle(type: DocumentType, systemName: string): string {
  const name = systemName || "[System Name]";
  switch (type) {
    case "technical":
      return `Technical Documentation - ${name} (Annex IV)`;
    case "conformity":
      return `EU Declaration of Conformity - ${name}`;
    case "post-market":
      return `Post-Market Monitoring Plan - ${name}`;
    case "user-instructions":
      return `User Instructions - ${name} (Art.13)`;
    case "fria":
      return `Fundamental Rights Impact Assessment Report - ${name}`;
    case "qms":
      return `Quality Management System Report - ${name}`;
    default:
      return `Compliance Document - ${name}`;
  }
}

function getTemplate(type: DocumentType, systemName: string): string {
  const name = systemName || "[System Name]";
  const date = new Date().toISOString().split("T")[0];

  switch (type) {
    case "technical":
      return `TECHNICAL DOCUMENTATION
Pursuant to Article 11 and Annex IV of the EU AI Act (Regulation (EU) 2024/1689)

System: ${name}
Document Version: 1.0
Date: ${date}
Classification: Confidential

================================================================================
1. GENERAL DESCRIPTION OF THE AI SYSTEM
================================================================================

1.1 System Name and Version
[Provide the name, version number, and release date of the AI system]

1.2 Intended Purpose
[Describe the specific purpose for which the AI system is designed]
- Primary use case(s):
- Target users / deployers:
- Deployment context(s):

1.3 Reasonably Foreseeable Misuse
[Identify ways the system could be used outside its intended purpose]

1.4 Persons Affected by the System
[Describe categories of natural persons likely to be affected]

================================================================================
2. SYSTEM DESIGN AND ARCHITECTURE
================================================================================

2.1 High-Level Architecture
[Describe the overall system architecture, including major components]

2.2 Data Flow
[Document how data flows through the system]

2.3 Algorithms and Models
[Describe the algorithms, model types, and key design choices]
- Model type: [e.g., supervised learning, deep neural network]
- Training methodology:
- Key hyperparameters:

2.4 Hardware and Software Requirements
[List minimum and recommended specifications]

================================================================================
3. DATA GOVERNANCE (Art.10)
================================================================================

3.1 Training Data
[Describe training datasets, collection methods, and representativeness]
- Data sources:
- Data volume:
- Data collection period:
- Representativeness analysis:

3.2 Validation and Testing Data
[Describe validation and test datasets and their separation from training data]

3.3 Data Preprocessing
[Document preprocessing steps, feature engineering, and transformations]

3.4 Bias Detection and Mitigation
[Describe measures taken to identify and mitigate bias]
- Bias metrics used:
- Mitigation strategies applied:
- Residual bias assessment:

3.5 Data Quality Assurance
[Describe data quality controls and validation procedures]

================================================================================
4. RISK MANAGEMENT (Art.9)
================================================================================

4.1 Risk Identification
[Document known and reasonably foreseeable risks]
- Risk register reference:

4.2 Risk Analysis and Evaluation
[Describe methods used to analyze and evaluate risks]

4.3 Risk Mitigation Measures
[Describe measures implemented to mitigate identified risks]

4.4 Residual Risk Acceptance
[Justify acceptance of any residual risks]

4.5 Risk Management Throughout Lifecycle
[Describe how risks are monitored and managed post-deployment]

================================================================================
5. PERFORMANCE METRICS AND TESTING
================================================================================

5.1 Performance Metrics
[Define the metrics used to evaluate system performance]
- Accuracy:
- Precision / Recall:
- F1 Score:
- Fairness metrics:
- Robustness metrics:

5.2 Test Methodology
[Describe testing protocols, datasets, and environments]

5.3 Benchmark Results
[Present quantitative performance results]

5.4 Edge Case Analysis
[Describe performance on edge cases and challenging scenarios]

================================================================================
6. TRANSPARENCY AND EXPLAINABILITY (Art.13)
================================================================================

6.1 Output Interpretability
[Describe how system outputs can be interpreted by deployers]

6.2 Explainability Methods
[Describe explainability techniques and their accessibility]

6.3 Information Provided to Deployers
[List all information provided to enable compliant deployment]

================================================================================
7. HUMAN OVERSIGHT (Art.14)
================================================================================

7.1 Oversight Mechanisms
[Describe the human oversight measures built into the system]

7.2 Override Capabilities
[Describe how human operators can override or correct system outputs]

7.3 Intervention Triggers
[Define circumstances under which human intervention is required]

================================================================================
8. ACCURACY, ROBUSTNESS, AND CYBERSECURITY (Art.15)
================================================================================

8.1 Accuracy Measures
[Describe measures taken to ensure appropriate accuracy levels]

8.2 Robustness Testing
[Describe robustness testing against adversarial attacks and data perturbation]

8.3 Cybersecurity Measures
[Describe technical and organizational cybersecurity measures]

8.4 Resilience to Errors and Faults
[Describe fault tolerance and error handling mechanisms]

================================================================================
9. CONFORMITY ASSESSMENT (Art.43)
================================================================================

9.1 Conformity Assessment Procedure
[Describe the chosen conformity assessment procedure]

9.2 Notified Body (if applicable)
[Provide details of the notified body involved]

9.3 Technical Documentation Availability
[Confirm availability of documentation for competent authorities]

================================================================================
10. DOCUMENT CONTROL
================================================================================

10.1 Version History
| Version | Date       | Author      | Description          |
|---------|------------|-------------|----------------------|
| 1.0     | ${date}    | [Author]    | Initial release      |

10.2 Review Schedule
[Describe the planned review and update schedule]

10.3 Approval
Prepared by: _________________ Date: _____________
Reviewed by: _________________ Date: _____________
Approved by: _________________ Date: _____________`;

    case "conformity":
      return `EU DECLARATION OF CONFORMITY
Pursuant to Article 47 of the EU AI Act (Regulation (EU) 2024/1689)

================================================================================
No. [Conformity Number]
================================================================================

1. The undersigned hereby declares that the AI system identified below complies
   with all applicable requirements of the EU AI Act.

2. AI SYSTEM IDENTIFICATION
--------------------------------------------------------------------------------
System Name:           ${name}
System Version:        [Version]
System ID / Model:     [Identifier]
Intended Purpose:      [Description]
Risk Classification:   High-Risk (Art.6)
Category:              [Annex III Reference]

3. MANUFACTURER / PROVIDER DETAILS
--------------------------------------------------------------------------------
Legal Entity Name:     [Company Name]
Registered Address:    [Full Address]
EU Representative:      [Name and Address, if applicable]
Contact Email:         [Email]
Contact Phone:         [Phone]

4. OBJECT OF THE DECLARATION
--------------------------------------------------------------------------------
This declaration covers the AI system named above in all its variants and
configurations as described in the accompanying technical documentation.

5. APPLICABLE REQUIREMENTS AND HARMONIZED STANDARDS
--------------------------------------------------------------------------------
The AI system complies with:

a) Regulation (EU) 2024/1689 (EU AI Act):
   - Title III, Chapter 2 (High-Risk AI Systems)
   - Articles 8 through 15

b) Relevant harmonized standards applied:
   - [List applicable harmonized standards with references]

c) Technical specifications:
   - [List other technical specifications]

6. CONFORMITY ASSESSMENT PROCEDURE
--------------------------------------------------------------------------------
Conformity assessment carried out in accordance with:
[ ] Article 43(2) - Internal control (with post-market monitoring)
[ ] Article 43(4) - Assessment based on quality management system
[ ] Article 43(5) - Assessment based on quality management system + product assessment

Notified Body (if applicable):
Name: [Body Name]
ID Number: [NB Number]

7. SPECIFIC REQUIREMENTS FULFILLED
--------------------------------------------------------------------------------
[ ] Risk management system (Art.9)
[ ] Data governance (Art.10)
[ ] Technical documentation (Art.11, Annex IV)
[ ] Record-keeping (Art.12)
[ ] Transparency and information to deployers (Art.13)
[ ] Human oversight (Art.14)
[ ] Accuracy, robustness, and cybersecurity (Art.15)
[ ] Quality management system (Art.17)
[ ] Post-market monitoring system (Art.72)
[ ] Serious incident reporting (Art.73)

8. DECLARATION
--------------------------------------------------------------------------------
This declaration is issued under the sole responsibility of the manufacturer.

Declaration issued on: ${date}

For and on behalf of:

____________________________________
Name: [Authorized Representative]
Position: [Title]
Organization: [Company Name]
Signature: ________________________
Date: _____________________________

9. ANNEXES
--------------------------------------------------------------------------------
Annex A: Technical Documentation (Art.11, Annex IV)
Annex B: Risk Management Report (Art.9)
Annex C: Data Governance Documentation (Art.10)
Annex D: Post-Market Monitoring Plan (Art.72)
Annex E: Quality Management System Certificate (if applicable)

================================================================================
END OF EU DECLARATION OF CONFORMITY
================================================================================`;

    case "post-market":
      return `POST-MARKET MONITORING PLAN
Pursuant to Article 72 of the EU AI Act (Regulation (EU) 2024/1689)

System: ${name}
Document Version: 1.0
Date: ${date}
Classification: Confidential

================================================================================
1. INTRODUCTION AND SCOPE
================================================================================

1.1 Purpose
This Post-Market Monitoring Plan (PMMP) establishes a systematic approach for
the ongoing collection, analysis, and reporting of performance data related to
${name} after it has been placed on the market or put into service.

1.2 Scope
This plan applies to all deployments and use cases of ${name} across all
EU Member States and covers the entire post-market lifecycle.

1.3 Regulatory Basis
- Article 72 of the EU AI Act (Regulation (EU) 2024/1689)
- Article 9 (Risk Management) - continuous risk identification
- Article 73 (Serious Incident Reporting)

================================================================================
2. MONITORING OBJECTIVES
================================================================================

2.1 Primary Objectives
- Verify continued compliance with EU AI Act requirements
- Detect and address previously unidentified risks
- Monitor system performance in real-world deployment conditions
- Ensure effectiveness of risk mitigation measures
- Identify opportunities for improvement

2.2 Key Performance Indicators (KPIs)
| KPI                          | Target      | Measurement Frequency |
|------------------------------|-------------|----------------------|
| System accuracy (overall)    | [Target]    | [Weekly/Monthly]     |
| False positive rate          | [Target]    | [Weekly/Monthly]     |
| False negative rate          | [Target]    | [Weekly/Monthly]     |
| User-reported incidents      | < [Number]  | Monthly               |
| System uptime                | [Target]    | Continuous           |
| Bias metric drift            | < [Threshold]| Monthly             |

================================================================================
3. DATA COLLECTION METHODS
================================================================================

3.1 Automated Data Collection
- System performance logs (automated)
- Error and exception tracking
- Input/output pattern analysis
- Latency and throughput monitoring
- Model drift detection metrics

3.2 User and Deployer Feedback
- Structured feedback forms for deployers
- Bug and issue reporting channels
- User satisfaction surveys (quarterly)
- Help desk and support ticket analysis

3.3 External Sources
- Academic research and publications
- Regulatory guidance updates
- Industry benchmark reports
- Competitor and market analysis

3.4 Data Storage and Retention
- All monitoring data stored in: [System/Location]
- Retention period: Minimum 5 years (or as required by applicable law)
- Access controls: [Description]
- Data protection: GDPR-compliant processing

================================================================================
4. ANALYSIS AND EVALUATION
================================================================================

4.1 Regular Analysis Schedule
| Analysis Type               | Frequency   | Responsible Team    |
|-----------------------------|-------------|---------------------|
| Performance review          | Monthly     | [Team]              |
| Risk assessment update      | Quarterly   | [Team]              |
| Bias and fairness audit     | Quarterly   | [Team]              |
| Comprehensive system review| Annually    | [Team]              |
| Ad-hoc incident analysis    | As needed   | [Team]              |

4.2 Analysis Methods
- Statistical analysis of performance metrics
- Trend analysis and anomaly detection
- Root cause analysis for incidents
- Comparative analysis against baseline performance
- User feedback sentiment analysis

================================================================================
5. INCIDENT MANAGEMENT
================================================================================

5.1 Incident Classification
| Severity | Description                              | Response Time |
|----------|------------------------------------------|---------------|
| Critical | System failure causing immediate harm     | < 4 hours     |
| High     | Significant performance degradation       | < 24 hours    |
| Medium   | Moderate issues requiring attention      | < 72 hours    |
| Low      | Minor issues with limited impact          | < 1 week      |

5.2 Serious Incident Reporting (Art.73)
All serious incidents shall be reported to the relevant market surveillance
authority within 15 days of becoming aware of the incident.
- Reporting authority: [Authority Name]
- Reporting method: [Method]
- Responsible person: [Name and Contact]

================================================================================
6. CORRECTIVE AND PREVENTIVE ACTIONS
================================================================================

6.1 Corrective Action Process
1. Issue identification and documentation
2. Root cause analysis
3. Corrective action planning
4. Implementation and verification
5. Effectiveness review

6.2 Update Triggers
The following events shall trigger a review of this plan:
- Serious incident occurrence
- Significant change in system performance
- New regulatory requirements
- Changes to system architecture or deployment
- Findings from conformity assessment

================================================================================
7. COMMUNICATION AND REPORTING
================================================================================

7.1 Internal Reporting
- Monthly monitoring dashboard to: [Stakeholders]
- Quarterly report to senior management
- Annual comprehensive review to board / compliance committee

7.2 External Reporting
- Market surveillance authorities (as required)
- Notified body (if applicable)
- Deployers (material changes)

================================================================================
8. PLAN GOVERNANCE
================================================================================

8.1 Document Control
| Version | Date       | Author      | Changes              |
|---------|------------|-------------|----------------------|
| 1.0     | ${date}    | [Author]    | Initial release      |

8.2 Review Schedule
This plan shall be reviewed and updated at least annually, or upon any
triggering event described in Section 6.2.

Prepared by: _________________ Date: _____________
Approved by: _________________ Date: _____________`;

    case "user-instructions":
      return `USER INSTRUCTIONS
Pursuant to Article 13 of the EU AI Act (Regulation (EU) 2024/1689)

System: ${name}
Document Version: 1.0
Date: ${date}

================================================================================
IMPORTANT NOTICE
================================================================================
This document provides instructions for the use of ${name}, a high-risk AI
system under the EU AI Act. Deployers must read and understand these
instructions before placing the system into service. Failure to follow these
instructions may result in non-compliance with EU AI Act obligations.

================================================================================
1. SYSTEM OVERVIEW
================================================================================

1.1 System Identification
- System Name: ${name}
- Version: [Version Number]
- Provider: [Provider Name]
- Contact: [Support Contact]

1.2 Intended Purpose
[Describe the specific purpose for which the system is designed]

1.3 System Capabilities
[Describe what the system can and cannot do]

1.4 Limitations
[Describe known limitations and constraints]

================================================================================
2. DEPLOYER OBLIGATIONS (Art.13(4))
================================================================================

Before deploying this AI system, deployers must:

2.1 Implement Human Oversight
- Assign qualified personnel to oversee system operation
- Establish procedures for reviewing system outputs
- Ensure override capability is available at all times

2.2 Monitor Operations
- Monitor system performance during operation
- Keep records of system outputs and decisions (Art.12)
- Report serious incidents to the provider and relevant authorities

2.3 Inform End Users
- Inform natural persons that they are interacting with an AI system
- Provide clear information about the system's purpose and limitations

2.4 Conduct Fundamental Rights Impact Assessment (if applicable)
- Public bodies must complete a FRIA before deployment (Art.27)
- Document the assessment and mitigation measures

================================================================================
3. TECHNICAL REQUIREMENTS
================================================================================

3.1 Hardware Requirements
- Minimum: [Specifications]
- Recommended: [Specifications]

3.2 Software Requirements
- Operating System: [Requirements]
- Dependencies: [List]
- Network: [Requirements]

3.3 Integration Requirements
[Describe integration requirements with existing systems]

3.4 Security Requirements
- Access control measures required
- Data encryption requirements
- Authentication requirements

================================================================================
4. OPERATING INSTRUCTIONS
================================================================================

4.1 Initial Setup
[Step-by-step setup instructions]

4.2 Input Specifications
[Describe expected input formats, ranges, and constraints]

4.3 Interpreting Outputs
[Describe how to interpret system outputs]
- Output format: [Description]
- Confidence levels: [Explanation]
- Limitations of output interpretation:

4.4 Handling Edge Cases
[Describe behavior with unusual inputs and how to respond]

4.5 Error Handling
[Common error messages and resolution steps]

================================================================================
5. HUMAN OVERSIGHT PROCEDURES
================================================================================

5.1 When to Intervene
Human intervention is required when:
- System confidence is below [threshold]
- Output appears inconsistent with expected behavior
- System generates alerts or warnings
- Affected persons raise concerns

5.2 Override Procedures
[Describe how to override system decisions]

5.3 Escalation Procedures
[Describe escalation paths for unresolved issues]

================================================================================
6. DATA AND RECORD-KEEPING
================================================================================

6.1 Automatic Logging
The system automatically records:
- Input data (as applicable)
- Output data and decisions
- Timestamps
- User interactions
- System alerts and errors

6.2 Log Retention
- Retention period: [Duration]
- Storage location: [Location]
- Access controls: [Description]

6.3 Data Protection
[Describe GDPR compliance measures for personal data processing]

================================================================================
7. PERFORMANCE MONITORING
================================================================================

7.1 Performance Metrics
[Describe key metrics deployers should monitor]

7.2 Reporting Issues
- Report issues to: [Contact]
- Serious incident reporting: [Art.73 procedure]

================================================================================
8. SUPPORT AND CONTACT
================================================================================

Technical Support: [Contact Details]
Compliance Questions: [Contact Details]
Serious Incident Reporting: [Contact Details]

================================================================================
END OF USER INSTRUCTIONS
================================================================================`;

    case "fria":
      return `FUNDAMENTAL RIGHTS IMPACT ASSESSMENT REPORT
Pursuant to Article 27 of the EU AI Act (Regulation (EU) 2024/1689)

System: ${name}
Document Version: 1.0
Date: ${date}
Assessing Entity: [Public Body / Entity Name]
Classification: [Classification Level]

================================================================================
EXECUTIVE SUMMARY
================================================================================

[Provide a brief summary of the assessment findings, key risks identified,
and recommended mitigation measures. This section should be suitable for
senior management and regulatory review.]

================================================================================
1. SYSTEM DESCRIPTION AND INTENDED PURPOSE (Art.27(1)(a))
================================================================================

1.1 System Overview
- System Name: ${name}
- Version: [Version]
- Provider: [Provider Name]
- Deployment Date: [Date]

1.2 Intended Purpose
[Describe in detail the specific task the AI system is designed to perform]

1.3 Deployment Context
- Geographic scope: [Member States / Regions]
- Sector: [Public sector domain]
- Affected population: [Description of affected persons]
- Scale of deployment: [Number of persons affected]

1.4 Decision-Making Process
[Describe how the system fits into the decision-making process and whether
it assists or replaces human decision-making]

================================================================================
2. LEGAL BASIS AND NECESSITY (Art.27(1)(b))
================================================================================

2.1 Legal Basis
[Identify the specific legal provision(s) under EU or Member State law
that authorize the use of this AI system]

2.2 Necessity Assessment
[Justify why the use of an AI system is necessary to achieve the stated
objective and why alternative means are insufficient]

2.3 Proportionality Analysis
[Assess whether the use of the AI system is proportionate to the objective
pursued, considering the impact on fundamental rights]

2.4 Alternatives Considered
| Alternative               | Advantages          | Disadvantages       | Reason for Rejection |
|---------------------------|---------------------|---------------------|----------------------|
| Human-only decision       | [Advantages]        | [Disadvantages]     | [Reason]             |
| Rule-based system         | [Advantages]        | [Disadvantages]     | [Reason]             |
| Other AI system           | [Advantages]        | [Disadvantages]     | [Reason]             |

================================================================================
3. RISKS TO FUNDAMENTAL RIGHTS (Art.27(1)(c))
================================================================================

3.1 Identified Risks

3.1.1 Right to Privacy and Data Protection (Art.7 CFR, GDPR)
- Risk description: [Describe specific privacy risks]
- Likelihood: [High / Medium / Low]
- Severity: [High / Medium / Low]
- Affected groups: [Description]

3.1.2 Right to Non-Discrimination (Art.21 CFR)
- Risk description: [Describe discrimination risks]
- Likelihood: [High / Medium / Low]
- Severity: [High / Medium / Low]
- Affected groups: [Description]

3.1.3 Freedom of Expression and Information (Art.11 CFR)
- Risk description: [Describe risks to freedom of expression]
- Likelihood: [High / Medium / Low]
- Severity: [High / Medium / Low]

3.1.4 Right to Fair Trial (Art.47 CFR)
- Risk description: [Describe risks to fair trial rights, if applicable]
- Likelihood: [High / Medium / Low]
- Severity: [High / Medium / Low]

3.1.5 Other Fundamental Rights
[Identify any other relevant rights at risk]

3.2 Risk Summary Matrix
| Right Affected            | Likelihood | Severity | Overall Risk |
|---------------------------|------------|----------|--------------|
| Privacy & Data Protection | [Level]    | [Level]  | [Level]      |
| Non-Discrimination         | [Level]    | [Level]  | [Level]      |
| Freedom of Expression     | [Level]    | [Level]  | [Level]      |
| Fair Trial                | [Level]    | [Level]  | [Level]      |

================================================================================
4. MITIGATION MEASURES (Art.27(1)(d))
================================================================================

4.1 Technical Measures
- [Measure 1]: [Description and expected effectiveness]
- [Measure 2]: [Description and expected effectiveness]
- [Measure 3]: [Description and expected effectiveness]

4.2 Organizational Measures
- [Measure 1]: [Description and expected effectiveness]
- [Measure 2]: [Description and expected effectiveness]

4.3 Procedural Safeguards
- Human oversight arrangements: [Description]
- Appeal and redress mechanisms: [Description]
- Complaint procedures: [Description]

4.4 Residual Risk Assessment
[Assess the level of risk remaining after mitigation measures are applied]

================================================================================
5. STAKEHOLDER CONSULTATION (Art.27(1)(e))
================================================================================

5.1 Internal Consultation
- Legal department review: [Date, findings]
- Data protection officer review: [Date, findings]
- Ethics committee review: [Date, findings]

5.2 External Consultation
- Affected groups consulted: [Groups and dates]
- Civil society engagement: [Description]
- Expert opinions obtained: [Description]

5.3 Consultation Outcomes
[Summarize key feedback received and how it was addressed]

================================================================================
6. NOTIFICATION TO AUTHORITY (Art.27(1)(f))
================================================================================

6.1 Competent Authority
- Authority Name: [Name]
- Notification Date: [Date]
- Notification Method: [Method]
- Reference Number: [Reference]

6.2 Authority Response
[Record any response or feedback received from the authority]

6.3 Follow-Up Actions
[Describe any actions taken in response to authority feedback]

================================================================================
7. CONCLUSIONS AND RECOMMENDATIONS
================================================================================

7.1 Overall Assessment
[Provide an overall assessment of whether the AI system should be deployed
given the identified risks and mitigation measures]

7.2 Conditions for Deployment
[List any conditions that must be met before or during deployment]

7.3 Ongoing Monitoring Requirements
[Describe ongoing monitoring requirements to ensure continued compliance
with fundamental rights protections]

================================================================================
8. APPROVAL
================================================================================

Prepared by: _________________ Position: _____________ Date: _____________
Reviewed by: _________________ Position: _____________ Date: _____________
Legal Review: _______________ Position: _____________ Date: _____________
Approved by: _________________ Position: _____________ Date: _____________

================================================================================
END OF FUNDAMENTAL RIGHTS IMPACT ASSESSMENT REPORT
================================================================================`;

    case "qms":
      return `QUALITY MANAGEMENT SYSTEM REPORT
Pursuant to Article 17 of the EU AI Act (Regulation (EU) 2024/1689)

System: ${name}
Document Version: 1.0
Date: ${date}
Organization: [Organization Name]
Classification: Confidential

================================================================================
1. QMS OVERVIEW
================================================================================

1.1 Purpose
This report documents the Quality Management System (QMS) established by
[Organization Name] to ensure ongoing compliance with Article 17 of the
EU AI Act for the high-risk AI system: ${name}.

1.2 Scope
This QMS covers all activities related to the development, deployment, and
post-market management of ${name}.

1.3 QMS Framework
[Describe the QMS framework adopted, e.g., ISO 9001-aligned, custom framework]

================================================================================
2. QUALITY POLICY AND OBJECTIVES
================================================================================

2.1 Quality Policy
[State the organization's quality policy for AI systems]

2.2 Quality Objectives
- [Objective 1]: [Target and timeline]
- [Objective 2]: [Target and timeline]
- [Objective 3]: [Target and timeline]

2.3 Management Commitment
[Describe senior management's commitment to QMS implementation]

================================================================================
3. ORGANIZATIONAL STRUCTURE AND RESPONSIBILITIES
================================================================================

3.1 Organizational Chart
[Describe or reference the organizational structure for AI compliance]

3.2 Roles and Responsibilities
| Role                        | Responsibilities                          | Assigned To |
|-----------------------------|------------------------------------------|-------------|
| AI Compliance Officer       | Overall QMS oversight and reporting      | [Name]      |
| Risk Manager                | Risk management system coordination       | [Name]      |
| Data Governance Lead        | Data quality and bias management          | [Name]      |
| Technical Documentation Lead| Technical documentation maintenance        | [Name]      |
| Quality Assurance Lead       | Testing and conformity assessment         | [Name]      |
| Post-Market Monitoring Lead | Post-market surveillance                  | [Name]      |

================================================================================
4. COMPLIANCE WITH ART.17 REQUIREMENTS
================================================================================

4.1 Risk Management System (Art.9)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Risk management process established: [Yes/No]
- Continuous risk identification: [Yes/No]
- Risk estimation and evaluation methods: [Description]
- Risk mitigation measures documented: [Yes/No]
- Residual risk acceptance criteria defined: [Yes/No]

4.2 Data Governance (Art.10)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Training data governance: [Description]
- Validation data governance: [Description]
- Testing data governance: [Description]
- Bias detection and correction: [Description]
- Data quality metrics: [Description]

4.3 Technical Documentation (Art.11, Annex IV)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Technical documentation maintained: [Yes/No]
- Last update: [Date]
- Available for competent authorities: [Yes/No]

4.4 Record-Keeping (Art.12)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Automatic logging enabled: [Yes/No]
- Log retention period: [Duration]
- Traceability measures: [Description]

4.5 Transparency and Information Provision (Art.13)
Status: [Compliant / Partially Compliant / Non-Compliant]
- User instructions prepared: [Yes/No]
- Deployer information provided: [Yes/No]

4.6 Human Oversight (Art.14)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Oversight mechanisms implemented: [Description]
- Override capabilities: [Description]

4.7 Accuracy, Robustness, and Cybersecurity (Art.15)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Accuracy targets defined and met: [Description]
- Robustness testing completed: [Yes/No]
- Cybersecurity measures implemented: [Description]

4.8 Quality Control and Conformity (Art.43)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Internal quality control process: [Description]
- Conformity assessment status: [Status]

4.9 Post-Market Monitoring (Art.72)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Post-market monitoring plan: [Reference]
- Active monitoring in place: [Yes/No]

4.10 Incident Reporting (Art.73)
Status: [Compliant / Partially Compliant / Non-Compliant]
- Incident reporting procedure: [Description]
- Reporting channels established: [Yes/No]

4.11 Corrective Actions
Status: [Compliant / Partially Compliant / Non-Compliant]
- Corrective action process: [Description]
- CAPA tracking system: [Yes/No]

================================================================================
5. PROCESS MANAGEMENT
================================================================================

5.1 Development Process
[Describe the AI system development process and quality gates]

5.2 Deployment Process
[Describe the deployment process and quality checks]

5.3 Change Management
[Describe the change management process for system updates]

5.4 Supplier Management
[Describe quality requirements for third-party components and services]

================================================================================
6. RESOURCE MANAGEMENT
================================================================================

6.1 Human Resources
- Training program for AI compliance: [Description]
- Competency requirements: [Description]
- Training records maintained: [Yes/No]

6.2 Infrastructure
- Development environment: [Description]
- Testing infrastructure: [Description]
- Monitoring infrastructure: [Description]

6.3 Knowledge Management
- Documentation management system: [Description]
- Lessons learned process: [Description]

================================================================================
7. AUDITS AND CONTINUOUS IMPROVEMENT
================================================================================

7.1 Internal Audit Schedule
| Audit Area                  | Frequency   | Last Audit  | Next Audit  |
|-----------------------------|-------------|-------------|-------------|
| Risk Management             | Quarterly   | [Date]      | [Date]      |
| Data Governance             | Quarterly   | [Date]      | [Date]      |
| Technical Documentation     | Semi-annual | [Date]      | [Date]      |
| Post-Market Monitoring      | Quarterly   | [Date]      | [Date]      |

7.2 Non-Conformity Management
[Describe the process for handling non-conformities]

7.3 Continuous Improvement Initiatives
[Describe ongoing improvement initiatives]

================================================================================
8. DOCUMENT CONTROL
================================================================================

| Version | Date       | Author      | Description          |
|---------|------------|-------------|----------------------|
| 1.0     | ${date}    | [Author]    | Initial release      |

Prepared by: _________________ Date: _____________
Reviewed by: _________________ Date: _____________
Approved by: _________________ Date: _____________

================================================================================
END OF QUALITY MANAGEMENT SYSTEM REPORT
================================================================================`;

    default:
      return "";
  }
}

export default function DocumentationPage() {
  const t = useTranslations();

  const [systems, setSystems] = useState<AISystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("technical");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const selectedSystem = systems.find((s) => s.id === selectedSystemId);

  // Fetch AI systems
  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-systems");
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data ?? []);
      }
    } catch (error) {
      console.error("[Documentation] Failed to fetch systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  // Fetch documents for selected system
  const fetchDocuments = useCallback(async (systemId: string) => {
    if (!systemId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?systemId=${systemId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data ?? []);
      }
    } catch (error) {
      console.error("[Documentation] Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSystemId) {
      fetchDocuments(selectedSystemId);
    } else {
      setDocuments([]);
    }
  }, [selectedSystemId, fetchDocuments]);

  // Update title and content when doc type changes
  useEffect(() => {
    const systemName = selectedSystem?.name ?? "";
    setTitle(generateTitle(selectedDocType, systemName));
    setContent(getTemplate(selectedDocType, systemName));
  }, [selectedDocType, selectedSystem?.name]);

  // Handle system change - update title/content with new system name
  const handleSystemChange = (systemId: string) => {
    setSelectedSystemId(systemId);
    const system = systems.find((s) => s.id === systemId);
    const systemName = system?.name ?? "";
    setTitle(generateTitle(selectedDocType, systemName));
    setContent(getTemplate(selectedDocType, systemName));
  };

  // Handle doc type change
  const handleDocTypeChange = (type: DocumentType) => {
    setSelectedDocType(type);
  };

  // Generate / save document
  const handleGenerate = async () => {
    if (!selectedSystemId || !title.trim() || !content.trim()) return;
    setIsGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: selectedSystemId,
          title: title.trim(),
          type: selectedDocType,
          content: content.trim(),
          status: "draft",
        }),
      });
      if (res.ok) {
        setMessage("Document generated successfully.");
        fetchDocuments(selectedSystemId);
      } else {
        setMessage("Failed to generate document.");
      }
    } catch (error) {
      console.error("[Documentation] Generate failed:", error);
      setMessage("Failed to generate document.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Print / save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Download individual document (opens print dialog)
  const handleDownload = (_doc: ComplianceDocument) => {
    window.print();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            Art. 11 / Art.13 / Art.17 / Art.27 / Art.47 / Art.72
          </span>
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">{t("tools.results")}          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation Generator</h1>
        <p className="text-muted-foreground">
          Generate EU AI Act compliance documents with pre-built templates.
          Select your AI system and document type to get started.
        </p>
      </div>

      {/* System Selector */}
      <div className="mt-8">
        <label className="block text-sm font-medium">{t("tools.selectSystem")}</label>
        <select
          value={selectedSystemId}
          onChange={(e) => handleSystemChange(e.target.value)}
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
            {t("tools.noSystems")}.{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              Register one
            </Link>{" "}
            in your dashboard first.
          </p>
        )}
      </div>

      {/* Document Type Selector */}
      <div className="mt-6">
        <label className="block text-sm font-medium">Document Type</label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DOCUMENT_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => handleDocTypeChange(dt.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedDocType === dt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{dt.label}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {dt.articleRef}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {dt.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Document Editor */}
      {selectedSystemId && (
        <div className="mt-8 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium">Document Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={24}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Select a document type to load a template..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Template pre-filled based on document type. Edit as needed before generating.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !title.trim() || !content.trim()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Document"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >{t("tools.download")}            </button>
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      )}

      {/* Previously Generated Documents */}
      {selectedSystemId && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold">
            Generated Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Documents previously generated for{" "}
            <span className="font-medium text-foreground">
              {selectedSystem?.name}
            </span>
          </p>

          {isLoading ? (
            <div className="mt-6 text-sm text-muted-foreground">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No documents generated yet. Use the form above to create your first document.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {documents.map((doc) => {
                const typeBadge = getDocumentTypeBadge(doc.type);
                const statusBadge = getStatusBadge(doc.status);
                const typeLabel =
                  DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label ?? doc.type;
                const createdDate = new Date(doc.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{doc.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadge.bg} ${typeBadge.text}`}
                        >
                          {typeLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          v{doc.version}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {createdDate}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="ml-4 inline-flex h-8 flex-shrink-0 items-center justify-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
