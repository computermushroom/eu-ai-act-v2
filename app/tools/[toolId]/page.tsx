// Tool Detail Page (Dynamic Route)
// Server Component: displays tool information and redirects to the actual tool page
// Handles /tools/[toolId] routes for tool discovery

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

/**
 * Known tool definitions
 */
const TOOL_DEFINITIONS: Record<
  string,
  {
    title: string;
    description: string;
    articleRef: string;
    href: string;
    tier: string;
    features: string[];
  }
> = {
  "risk-assessment": {
    title: "Risk Classification",
    description:
      "Classify your AI system according to EU AI Act Article 6 risk levels. Answer 10 questions about your system's application area, decision impact, and data handling to determine if it falls under unacceptable, high-risk, limited, or minimal risk categories.",
    articleRef: "Art.6",
    href: "/tools/risk-assessment",
    tier: "Free",
    features: [
      "10-question assessment questionnaire",
      "4 risk level classification",
      "Detailed risk explanation per level",
      "Actionable compliance recommendations",
      "PDF report generation",
    ],
  },
  "prohibited-practices": {
    title: "Prohibited Practices Check",
    description:
      "Check your AI system against Article 5 of the EU AI Act for prohibited practices. Review 8 categories of banned AI applications including subliminal manipulation, social scoring, and real-time biometric identification.",
    articleRef: "Art.5",
    href: "/tools/prohibited-practices",
    tier: "Starter",
    features: [
      "8 prohibited practice categories",
      "Prohibited vs restricted classification",
      "Detailed legal references",
      "Compliance gap identification",
      "Remediation suggestions",
    ],
  },
  transparency: {
    title: "Transparency Check",
    description:
      "Verify your AI system meets Article 50 transparency obligations. Ensure proper disclosure of AI interaction, bot identification, and content generation transparency as required by the EU AI Act.",
    articleRef: "Art.50",
    href: "/tools/transparency",
    tier: "Starter",
    features: [
      "5 transparency obligation checks",
      "Disclosure requirement verification",
      "Bot/AI agent identification rules",
      "Content generation labeling",
      "User notification requirements",
    ],
  },
  "url-scan": {
    title: "URL Compliance Scan",
    description:
      "Scan any website URL for EU AI Act compliance indicators. Detects AI technology usage, transparency disclosures, GDPR compliance markers, and high-risk practice indicators on public web pages.",
    articleRef: "General",
    href: "/tools/url-scan",
    tier: "Free",
    features: [
      "6 compliance check categories",
      "30+ detection indicators",
      "0-100 compliance score",
      "AI technology detection",
      "GDPR compliance verification",
    ],
  },
};

/**
 * Generate metadata for tool detail pages
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>;
}): Promise<Metadata> {
  const { toolId } = await params;
  const tool = TOOL_DEFINITIONS[toolId];

  if (!tool) {
    return { title: "Tool Not Found" };
  }

  return {
    title: `${tool.title} - EU AI Act Compliance Tool`,
    description: tool.description,
  };
};

/**
 * Generate static params for known tools
 */
export function generateStaticParams() {
  return Object.keys(TOOL_DEFINITIONS).map((toolId) => ({ toolId }));
}

/**
 * Tool detail page
 */
export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const tool = TOOL_DEFINITIONS[toolId];

  // If tool exists, redirect to its actual page
  if (tool) {
    redirect(tool.href);
  }

  // Unknown tool ID - show 404
  notFound();
}
