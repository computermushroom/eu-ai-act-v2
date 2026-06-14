// PDF Report Document Template
// Uses @react-pdf/renderer for PDF generation
// Server-side rendering via dynamic import
// Template: EU AI Act Compliance Assessment Report

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Color Palette ───────────────────────────────────────────────
const COLORS = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryBg: "#eff6ff",
  dark: "#0f172a",
  text: "#1e293b",
  muted: "#64748b",
  lightMuted: "#94a3b8",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  success: "#16a34a",
  successBg: "#f0fdf4",
  warning: "#d97706",
  warningBg: "#fffbeb",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  white: "#ffffff",
};

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Page
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.text,
  },

  // ── Cover Page ──
  coverPage: {
    padding: 0,
    flexDirection: "column",
  },
  coverTopBar: {
    height: 8,
    backgroundColor: COLORS.primary,
  },
  coverContent: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
  },
  coverLogo: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 40,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.dark,
    textAlign: "center",
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 40,
  },
  coverDivider: {
    width: 80,
    height: 3,
    backgroundColor: COLORS.primary,
    marginBottom: 40,
  },
  coverMetaContainer: {
    width: "100%",
    maxWidth: 300,
  },
  coverMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  coverMetaLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  coverMetaValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  coverBottomBar: {
    height: 60,
    backgroundColor: COLORS.primaryBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coverBottomText: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerLogo: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerTagline: {
    fontSize: 8,
    color: COLORS.lightMuted,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  headerDocType: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  headerRef: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ── Section ──
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 6,
  },
  text: {
    marginBottom: 6,
    color: COLORS.text,
    fontSize: 10,
  },
  mutedText: {
    marginBottom: 6,
    color: COLORS.muted,
    fontSize: 9,
  },

  // ── Table ──
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.borderLight,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: COLORS.text,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  // ── Info Rows ──
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 9,
    color: COLORS.dark,
  },

  // ── Badges ──
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  badgeHigh: {
    backgroundColor: COLORS.dangerBg,
    color: COLORS.danger,
  },
  badgeMedium: {
    backgroundColor: COLORS.warningBg,
    color: COLORS.warning,
  },
  badgeLow: {
    backgroundColor: COLORS.successBg,
    color: COLORS.success,
  },

  // ── Score Box ──
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  scoreBoxSuccess: {
    backgroundColor: COLORS.successBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  scoreBoxWarning: {
    backgroundColor: COLORS.warningBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  scoreBoxDanger: {
    backgroundColor: COLORS.dangerBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 12,
  },
  scoreValueSuccess: {
    color: COLORS.success,
  },
  scoreValueWarning: {
    color: COLORS.warning,
  },
  scoreValueDanger: {
    color: COLORS.danger,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  scoreDescription: {
    fontSize: 9,
    color: COLORS.muted,
  },

  // ── Risk Matrix ──
  riskMatrixContainer: {
    marginBottom: 12,
  },
  riskMatrixRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  riskMatrixHeader: {
    width: 100,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.white,
    backgroundColor: COLORS.primary,
  },
  riskMatrixCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.white,
    color: COLORS.dark,
  },
  riskMatrixLabel: {
    width: 100,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.dark,
    backgroundColor: COLORS.borderLight,
  },
  riskLow: { backgroundColor: COLORS.successBg },
  riskMedium: { backgroundColor: COLORS.warningBg },
  riskHigh: { backgroundColor: COLORS.dangerBg },
  riskCritical: { backgroundColor: "#7f1d1d", color: COLORS.white },

  // ── Recommendation ──
  recommendation: {
    flexDirection: "row",
    marginBottom: 8,
    padding: 10,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
  },
  recommendationPriority: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 3,
    paddingVertical: 4,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 3,
  },
  recommendationDesc: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 3,
  },
  recommendationArticle: {
    fontSize: 8,
    color: COLORS.primary,
  },

  // ── Signature Block ──
  signatureBlock: {
    flexDirection: "row",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  signatureSection: {
    flex: 1,
    paddingHorizontal: 10,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark,
    marginBottom: 6,
    width: 180,
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },

  // ── TOC ──
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingHorizontal: 4,
  },
  tocTitle: {
    fontSize: 10,
    color: COLORS.text,
  },
  tocPage: {
    fontSize: 10,
    color: COLORS.muted,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    fontSize: 7,
    color: COLORS.lightMuted,
  },

  // ── Disclaimer ──
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  disclaimerText: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ── Utility ──
  flexRow: {
    flexDirection: "row",
  },
  flexCol: {
    flexDirection: "column",
  },
  flex1: {
    flex: 1,
  },
  ml10: {
    marginLeft: 10,
  },
  mr10: {
    marginRight: 10,
  },
  mb10: {
    marginBottom: 10,
  },
  mb6: {
    marginBottom: 6,
  },
  mb4: {
    marginBottom: 4,
  },
  mt10: {
    marginTop: 10,
  },
  w50: {
    width: "50%",
  },
  gap10: {
    gap: 10,
  },
});

// ─── Types ────────────────────────────────────────────────────────

export interface ComplianceItem {
  art: string;
  title: string;
  description: string;
  compliant: boolean;
  details?: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  article: string;
}

export interface ReportData {
  systemName: string;
  systemType: string;
  riskLevel: string;
  status: string;
  industry: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  reportType: string;
  reportId: string;
  generatedAt: string;
  locale: string;
  complianceItems: ComplianceItem[];
  scanResults: { scanType: string; score: number; status: string; createdAt: Date }[];
  qms: { completionRate: number; status: string } | null;
  fria: { status: string; overallScore: number | null } | null;
  documents: { title: string; type: string; status: string }[];
}

// ─── Helper: generate document reference number ─────────────────
function generateRefNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `EUAI-${year}-${month}${day}-${seq}`;
}

// ─── Helper: get risk color style ────────────────────────────────
function getRiskStyle(riskLevel: string) {
  switch (riskLevel) {
    case "high":
    case "critical":
      return { scoreBox: styles.scoreBoxDanger, scoreValue: styles.scoreValueDanger, badge: styles.badgeHigh };
    case "medium":
    case "limited":
    case "warning":
      return { scoreBox: styles.scoreBoxWarning, scoreValue: styles.scoreValueWarning, badge: styles.badgeMedium };
    default:
      return { scoreBox: styles.scoreBoxSuccess, scoreValue: styles.scoreValueSuccess, badge: styles.badgeLow };
  }
}

// ─── Cover Page ───────────────────────────────────────────────────
function CoverPage({ data }: { data: ReportData }) {
  const refNumber = generateRefNumber();
  const reportTypeLabel = data.reportType
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Page size="A4" style={[styles.page, styles.coverPage]}>
      <View style={styles.coverTopBar} />
      <View style={styles.coverContent}>
        <Text style={styles.coverLogo}>EU AI Act</Text>
        <Text style={styles.coverTitle}>Compliance Assessment Report</Text>
        <Text style={styles.coverSubtitle}>{data.systemName}</Text>
        <View style={styles.coverDivider} />
        <View style={styles.coverMetaContainer}>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Document Reference</Text>
            <Text style={styles.coverMetaValue}>{refNumber}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Report Type</Text>
            <Text style={styles.coverMetaValue}>{reportTypeLabel}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Date Generated</Text>
            <Text style={styles.coverMetaValue}>{data.generatedAt}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>System Classification</Text>
            <Text style={styles.coverMetaValue}>{data.riskLevel || "Not Classified"}</Text>
          </View>
          <View style={styles.coverMetaRow}>
            <Text style={styles.coverMetaLabel}>Report ID</Text>
            <Text style={styles.coverMetaValue}>{data.reportId}</Text>
          </View>
        </View>
      </View>
      <View style={styles.coverBottomBar}>
        <Text style={styles.coverBottomText}>
          CONFIDENTIAL - EU AI Act Compliance Assessment | Regulation (EU) 2024/1689
        </Text>
      </View>
    </Page>
  );
}

// ─── Table of Contents Page ───────────────────────────────────────
function TableOfContentsPage() {
  const tocItems = [
    { title: "1. Executive Summary", page: "3" },
    { title: "2. System Overview", page: "3" },
    { title: "3. EU AI Act Compliance Status", page: "4" },
    { title: "4. Article-by-Article Assessment", page: "4" },
    { title: "5. Risk Assessment Matrix", page: "5" },
    { title: "6. Scan Results Analysis", page: "6" },
    { title: "7. Quality Management System (Art.17)", page: "6" },
    { title: "8. Fundamental Rights Impact Assessment (Art.27)", page: "7" },
    { title: "9. Recommendations", page: "7" },
    { title: "10. Appendix: Related Documents", page: "8" },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Table of Contents</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Table of Contents</Text>

      {tocItems.map((item, index) => (
        <View key={index} style={styles.tocItem}>
          <Text style={styles.tocTitle}>{item.title}</Text>
          <Text style={styles.tocPage}>{item.page}</Text>
        </View>
      ))}

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Executive Summary Page ──────────────────────────────────────
function ExecutiveSummaryPage({ data }: { data: ReportData }) {
  const compliantCount = data.complianceItems.filter((i) => i.compliant).length;
  const totalCount = data.complianceItems.length;
  const complianceRate = Math.round((compliantCount / totalCount) * 100);
  const riskStyle = getRiskStyle(complianceRate >= 80 ? "low" : complianceRate >= 50 ? "medium" : "high");

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Executive Summary</Text>
          <Text style={styles.headerRef}>{data.reportId}</Text>
        </View>
      </View>

      {/* 1. Executive Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Executive Summary</Text>
        <Text style={styles.text}>
          This report presents the compliance assessment of <Text style={{ fontWeight: "bold" }}>{data.systemName}</Text>,
          classified as a <Text style={{ fontWeight: "bold" }}>{data.riskLevel || "unclassified"}</Text> AI system
          under the EU Artificial Intelligence Act (Regulation (EU) 2024/1689). The assessment covers
          the system&apos;s adherence to key regulatory requirements including risk management, data governance,
          transparency obligations, and human oversight mechanisms.
        </Text>

        {/* Overall Score Box */}
        <View style={[styles.scoreBox, riskStyle.scoreBox]}>
          <Text style={[styles.scoreValue, riskStyle.scoreValue]}>{complianceRate}%</Text>
          <View>
            <Text style={styles.scoreLabel}>Overall Compliance Score</Text>
            <Text style={styles.scoreDescription}>
              {compliantCount} of {totalCount} articles assessed as compliant
            </Text>
          </View>
        </View>

        <Text style={styles.text}>
          {complianceRate >= 80
            ? "The system demonstrates a high level of compliance with the EU AI Act requirements. Minor improvements are recommended to achieve full compliance."
            : complianceRate >= 50
              ? "The system shows partial compliance with EU AI Act requirements. Several areas require attention and remediation to meet regulatory standards."
              : "The system has significant compliance gaps that require immediate attention. Priority remediation is needed across multiple articles of the EU AI Act."}
        </Text>
      </View>

      {/* 2. System Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. System Overview</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>System Name</Text>
          <Text style={styles.infoValue}>{data.systemName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>System Type</Text>
          <Text style={styles.infoValue}>{data.systemType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Risk Classification</Text>
          <Text style={styles.infoValue}>{data.riskLevel || "Not classified"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Industry</Text>
          <Text style={styles.infoValue}>{data.industry || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={styles.infoValue}>{data.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created</Text>
          <Text style={styles.infoValue}>{data.createdAt.toLocaleDateString(data.locale)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>{data.updatedAt.toLocaleDateString(data.locale)}</Text>
        </View>
        {data.description && (
          <View style={styles.mt10}>
            <Text style={styles.mutedText}>{data.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Compliance Status Page ───────────────────────────────────────
function ComplianceStatusPage({ data }: { data: ReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Compliance Assessment</Text>
          <Text style={styles.headerRef}>{data.reportId}</Text>
        </View>
      </View>

      {/* 3. Compliance Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. EU AI Act Compliance Status</Text>
        <Text style={styles.text}>
          The following table summarizes the compliance status of the AI system against the key articles
          of the EU AI Act (Regulation (EU) 2024/1689). Each article is assessed for adherence to the
          specific requirements outlined in the regulation.
        </Text>
      </View>

      {/* 4. Article-by-Article Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Article-by-Article Assessment</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 50 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { width: 50 }]}>Article</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Requirement</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Assessment</Text>
        </View>

        {/* Table Rows */}
        {data.complianceItems.map((item, index) => {
          const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
          const badgeStyle = item.compliant ? styles.badgeLow : styles.badgeHigh;
          return (
            <View key={index} style={rowStyle}>
              <View style={[styles.badge, badgeStyle, { width: 50, marginRight: 4 }]}>
                <Text>{item.compliant ? "PASS" : "FAIL"}</Text>
              </View>
              <Text style={[styles.tableCellBold, { width: 50 }]}>{item.art}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.title}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Risk Matrix Page ─────────────────────────────────────────────
function RiskMatrixPage({ data }: { data: ReportData }) {
  const riskLevel = data.riskLevel || "unknown";

  // Build recommendations based on compliance gaps
  const recommendations: Recommendation[] = [];

  data.complianceItems.forEach((item) => {
    if (!item.compliant) {
      recommendations.push({
        title: `Address ${item.title} Non-Compliance`,
        description: `The system does not meet the requirements of ${item.art}. ${item.details || "Remediation is required to achieve compliance."}`,
        priority: "high",
        article: item.art,
      });
    }
  });

  if (data.qms && data.qms.completionRate < 100) {
    recommendations.push({
      title: "Complete Quality Management System Implementation",
      description: `QMS completion rate is at ${data.qms.completionRate}%. Full implementation is required under Art.17 for high-risk AI systems.`,
      priority: data.qms.completionRate < 50 ? "high" : "medium",
      article: "Art.17",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain Current Compliance Level",
      description: "The system meets all assessed EU AI Act requirements. Continue monitoring and maintaining compliance as regulations evolve.",
      priority: "low",
      article: "General",
    });
  }

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Risk Assessment</Text>
          <Text style={styles.headerRef}>{data.reportId}</Text>
        </View>
      </View>

      {/* 5. Risk Matrix */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Risk Assessment Matrix</Text>
        <Text style={styles.text}>
          The following risk matrix evaluates the system&apos;s risk profile based on the EU AI Act
          risk classification framework (Art.6). The system is currently classified as{" "}
          <Text style={{ fontWeight: "bold" }}>{riskLevel.toUpperCase()}</Text> risk.
        </Text>

        <View style={styles.riskMatrixContainer}>
          {/* Matrix Header */}
          <View style={styles.riskMatrixRow}>
            <View style={styles.riskMatrixHeader}>
              <Text>Risk Category</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskLow]}>
              <Text>Minimal</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskMedium]}>
              <Text>Limited</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskHigh]}>
              <Text>High</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskCritical]}>
              <Text>Unacceptable</Text>
            </View>
          </View>
          {/* Matrix Rows */}
          <View style={styles.riskMatrixRow}>
            <View style={styles.riskMatrixLabel}><Text>System Risk</Text></View>
            <View style={[styles.riskMatrixCell, riskLevel === "minimal" || riskLevel === "low" ? styles.riskLow : styles.riskMedium]}>
              <Text>{riskLevel === "minimal" || riskLevel === "low" ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, riskLevel === "limited" ? styles.riskLow : styles.riskMedium]}>
              <Text>{riskLevel === "limited" ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, riskLevel === "high" ? styles.riskLow : styles.riskHigh]}>
              <Text>{riskLevel === "high" ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskCritical]}>
              <Text>{riskLevel === "unacceptable" ? "[X]" : ""}</Text>
            </View>
          </View>
          <View style={styles.riskMatrixRow}>
            <View style={styles.riskMatrixLabel}><Text>Data Quality</Text></View>
            <View style={[styles.riskMatrixCell, data.complianceItems.find(i => i.art === "Art.10")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{data.complianceItems.find(i => i.art === "Art.10")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskMedium]}><Text></Text></View>
            <View style={[styles.riskMatrixCell, !data.complianceItems.find(i => i.art === "Art.10")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{!data.complianceItems.find(i => i.art === "Art.10")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskCritical]}><Text></Text></View>
          </View>
          <View style={styles.riskMatrixRow}>
            <View style={styles.riskMatrixLabel}><Text>Transparency</Text></View>
            <View style={[styles.riskMatrixCell, data.complianceItems.find(i => i.art === "Art.13")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{data.complianceItems.find(i => i.art === "Art.13")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskMedium]}><Text></Text></View>
            <View style={[styles.riskMatrixCell, !data.complianceItems.find(i => i.art === "Art.13")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{!data.complianceItems.find(i => i.art === "Art.13")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskCritical]}><Text></Text></View>
          </View>
          <View style={styles.riskMatrixRow}>
            <View style={styles.riskMatrixLabel}><Text>Human Oversight</Text></View>
            <View style={[styles.riskMatrixCell, data.complianceItems.find(i => i.art === "Art.14")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{data.complianceItems.find(i => i.art === "Art.14")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskMedium]}><Text></Text></View>
            <View style={[styles.riskMatrixCell, !data.complianceItems.find(i => i.art === "Art.14")?.compliant ? styles.riskLow : styles.riskHigh]}>
              <Text>{!data.complianceItems.find(i => i.art === "Art.14")?.compliant ? "[X]" : ""}</Text>
            </View>
            <View style={[styles.riskMatrixCell, styles.riskCritical]}><Text></Text></View>
          </View>
        </View>
      </View>

      {/* 9. Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Recommendations</Text>
        <Text style={styles.text}>
          Based on the compliance assessment, the following recommendations are provided in order of priority.
          High-priority items require immediate attention to achieve regulatory compliance.
        </Text>

        {recommendations.map((rec, index) => {
          const priorityBadgeStyle =
            rec.priority === "high"
              ? styles.badgeHigh
              : rec.priority === "medium"
                ? styles.badgeMedium
                : styles.badgeLow;
          return (
            <View key={index} style={styles.recommendation}>
              <View style={[styles.recommendationPriority, priorityBadgeStyle]}>
                <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                  {rec.priority.toUpperCase()}
                </Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.recommendationDesc}>{rec.description}</Text>
                <Text style={styles.recommendationArticle}>Reference: {rec.article} - EU AI Act</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Detailed Findings Page ──────────────────────────────────────
function DetailedFindingsPage({ data }: { data: ReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Detailed Findings</Text>
          <Text style={styles.headerRef}>{data.reportId}</Text>
        </View>
      </View>

      {/* 6. Scan Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Scan Results Analysis</Text>
        {data.scanResults.length > 0 ? (
          <>
            <Text style={styles.text}>
              The following automated scan results provide quantitative metrics on the system&apos;s
              compliance posture across different assessment dimensions.
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Scan Type</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Score</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
            </View>
            {data.scanResults.map((sr, index) => {
              const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
              const statusBadge =
                sr.status === "pass"
                  ? styles.badgeLow
                  : sr.status === "warning"
                    ? styles.badgeMedium
                    : styles.badgeHigh;
              return (
                <View key={index} style={rowStyle}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{sr.scanType}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{sr.score}/100</Text>
                  <View style={[styles.badge, statusBadge, { flex: 1, marginRight: 4 }]}>
                    <Text>{sr.status.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{sr.createdAt.toLocaleDateString(data.locale)}</Text>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.mutedText}>No automated scan results are available for this system.</Text>
        )}
      </View>

      {/* 7. QMS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Quality Management System (Art.17)</Text>
        {data.qms ? (
          <>
            <Text style={styles.text}>
              Under Article 17 of the EU AI Act, providers of high-risk AI systems must establish,
              implement, document, and maintain a quality management system. The following summarizes
              the current QMS status.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Completion Rate</Text>
              <Text style={styles.infoValue}>{data.qms.completionRate}%</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{data.qms.status}</Text>
            </View>
            {data.qms.completionRate < 100 && (
              <Text style={[styles.mutedText, styles.mt10]}>
                Note: QMS implementation is incomplete. Full compliance with Art.17 requires completion
                of all quality management system components including quality policy, quality objectives,
                roles and responsibilities, and documented procedures.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.mutedText}>
            No Quality Management System checklist has been initiated for this system.
            Art.17 compliance requires a comprehensive QMS for high-risk AI systems.
          </Text>
        )}
      </View>

      {/* 8. FRIA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Fundamental Rights Impact Assessment (Art.27)</Text>
        {data.fria ? (
          <>
            <Text style={styles.text}>
              Article 27 of the EU AI Act requires certain high-risk AI systems to undergo a fundamental
              rights impact assessment before being placed on the market. The FRIA evaluates potential
              impacts on fundamental rights, including privacy, non-discrimination, and freedom of expression.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Overall Score</Text>
              <Text style={styles.infoValue}>{data.fria.overallScore != null ? `${data.fria.overallScore}/100` : "Not scored"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assessment Status</Text>
              <Text style={styles.infoValue}>{data.fria.status}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.mutedText}>
            No Fundamental Rights Impact Assessment has been conducted for this system.
            Art.27 requires a FRIA for AI systems deployed by public entities or in specific high-risk contexts.
          </Text>
        )}
      </View>

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Appendix Page ────────────────────────────────────────────────
function AppendixPage({ data }: { data: ReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLogo}>EU AI Act Compliance</Text>
          <Text style={styles.headerTagline}>Regulation (EU) 2024/1689</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDocType}>Appendix</Text>
          <Text style={styles.headerRef}>{data.reportId}</Text>
        </View>
      </View>

      {/* 10. Appendix: Related Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Appendix: Related Documents</Text>
        {data.documents.length > 0 ? (
          <>
            <Text style={styles.text}>
              The following documents are associated with this AI system and support the compliance assessment.
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Document Title</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
            </View>
            {data.documents.map((doc, index) => {
              const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlt;
              return (
                <View key={index} style={rowStyle}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{doc.title}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{doc.type}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{doc.status}</Text>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.mutedText}>No related documents have been uploaded for this system.</Text>
        )}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          DISCLAIMER: This compliance assessment report is generated for informational purposes only and
          does not constitute legal advice. The assessment is based on the data provided and automated
          analysis of the AI system&apos;s configuration. Organizations should consult with qualified legal
          counsel to determine their specific compliance obligations under the EU AI Act (Regulation (EU) 2024/1689).
          The regulatory landscape is evolving, and requirements may change. This report reflects the state
          of compliance at the time of generation ({data.generatedAt}).
        </Text>
      </View>

      {/* Signature Block */}
      <View style={styles.signatureBlock}>
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Compliance Officer</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Name / Signature</Text>
          <Text style={styles.signatureLabel}>Date: {data.generatedAt}</Text>
        </View>
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLabel}>Reviewed By</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Name / Signature</Text>
          <Text style={styles.signatureLabel}>Date: _______________</Text>
        </View>
      </View>

      <View style={styles.footer} fixed>
        <Text>EU AI Act Compliance Assessment Report</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  );
}

// ─── Main Document Component ─────────────────────────────────────
/**
 * Compliance Report PDF Document
 * Multi-page professional report for EU AI Act compliance assessment
 */
export function ComplianceReportDocument({ data }: { data: ReportData }) {
  return (
    <Document
      title={`EU AI Act Compliance Report - ${data.systemName}`}
      author="EU AI Act Compliance Tool"
      subject="Compliance Assessment Report"
      creator="EU AI Act Compliance Tool"
      producer="EU AI Act Compliance Tool - @react-pdf/renderer"
    >
      <CoverPage data={data} />
      <TableOfContentsPage />
      <ExecutiveSummaryPage data={data} />
      <ComplianceStatusPage data={data} />
      <RiskMatrixPage data={data} />
      <DetailedFindingsPage data={data} />
      <AppendixPage data={data} />
    </Document>
  );
}
