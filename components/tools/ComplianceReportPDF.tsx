// PDF Report Document Template
// Uses @react-pdf/renderer for PDF generation
// Server-side rendering via dynamic import
// Template: Compliance Assessment Report

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

/**
 * PDF styles - consistent branding
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#1e40af",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
  },
  date: {
    fontSize: 9,
    color: "#64748b",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  text: {
    marginBottom: 6,
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 2,
  },
  label: {
    fontWeight: "bold",
    color: "#475569",
  },
  value: {
    color: "#0f172a",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  badgeHigh: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
  },
  badgeMedium: {
    backgroundColor: "#fffbeb",
    color: "#d97706",
  },
  badgeLow: {
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    fontSize: 8,
    color: "#94a3b8",
  },
});

/**
 * Compliance Report PDF Document
 * Reusable template for all compliance report types
 */
export function ComplianceReportDocument({
  title,
  subtitle,
  sections,
  generatedAt,
  reportId,
}: {
  title: string;
  subtitle: string;
  sections: {
    title: string;
    items: { label: string; value: string; riskLevel?: "high" | "medium" | "low" }[];
  }[];
  generatedAt: string;
  reportId: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>AI Act Compliance</Text>
          <Text style={styles.date}>{generatedAt}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={[styles.text, { fontSize: 9, color: "#94a3b8" }]}>
          Report ID: {reportId}
        </Text>

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                {item.riskLevel ? (
                  <View
                    style={[
                      styles.badge,
                      item.riskLevel === "high"
                        ? styles.badgeHigh
                        : item.riskLevel === "medium"
                        ? styles.badgeMedium
                        : styles.badgeLow,
                    ]}
                  >
                    <Text>{item.value}</Text>
                  </View>
                ) : (
                  <Text style={styles.value}>{item.value}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>AI Act Compliance Tool - EU AI Act Compliance Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
