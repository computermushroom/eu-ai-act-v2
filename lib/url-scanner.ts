// URL Compliance Scan Service
// Analyzes a URL for EU AI Act compliance indicators
// Checks: AI disclosure, transparency, data practices, risk indicators

import { z } from "zod";

/**
 * URL validation schema
 */
const urlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: "Must be a valid HTTP/HTTPS URL" }
);

/**
 * Compliance check result for a single indicator
 */
interface ComplianceCheck {
  category: string;
  indicator: string;
  status: "pass" | "fail" | "warning" | "info";
  description: string;
  evidence?: string;
}

/**
 * URL scan result
 */
export interface UrlScanResult {
  url: string;
  scannedAt: string;
  overallScore: number; // 0-100
  checks: ComplianceCheck[];
  summary: string;
}

/**
 * Keywords and patterns for AI compliance detection
 */
const AI_INDICATORS = [
  { pattern: /artificial intelligence/gi, label: "AI technology mention" },
  { pattern: /machine learning/gi, label: "Machine learning mention" },
  { pattern: /deep learning/gi, label: "Deep learning mention" },
  { pattern: /neural network/gi, label: "Neural network mention" },
  { pattern: /natural language processing/gi, label: "NLP mention" },
  { pattern: /computer vision/gi, label: "Computer vision mention" },
  { pattern: /generative ai/gi, label: "Generative AI mention" },
  { pattern: /large language model/gi, label: "LLM mention" },
  { pattern: /algorithm/gi, label: "Algorithm mention" },
  { pattern: /automation/gi, label: "Automation mention" },
];

const TRANSPARENCY_INDICATORS = [
  { pattern: /privacy policy/gi, label: "Privacy policy reference" },
  { pattern: /terms of service/gi, label: "Terms of service reference" },
  { pattern: /cookie policy/gi, label: "Cookie policy reference" },
  { pattern: /gdpr/gi, label: "GDPR compliance mention" },
  { pattern: /data protection/gi, label: "Data protection mention" },
  { pattern: /consent/gi, label: "Consent mechanism mention" },
  { pattern: /opt.out/gi, label: "Opt-out mechanism mention" },
  { pattern: /right to.*delete/gi, label: "Right to deletion mention" },
  { pattern: /data processing/gi, label: "Data processing disclosure" },
  { pattern: /third.party.*data/gi, label: "Third-party data sharing" },
];

const RISK_INDICATORS = [
  { pattern: /biometric/gi, label: "Biometric data processing (high risk)" },
  { pattern: /facial recognition/gi, label: "Facial recognition (high risk)" },
  { pattern: /emotion detection/gi, label: "Emotion detection (high risk)" },
  { pattern: /social scoring/gi, label: "Social scoring (prohibited)" },
  { pattern: /real.time.*identification/gi, label: "Real-time remote identification (high risk)" },
  { pattern: /predictive policing/gi, label: "Predictive policing (high risk)" },
  { pattern: /manipulation.*subliminal/gi, label: "Subliminal manipulation (prohibited)" },
  { pattern: /exploitation.*vulnerability/gi, label: "Vulnerability exploitation (prohibited)" },
  { pattern: /health.*data/gi, label: "Health data processing (high risk)" },
  { pattern: /credit.*scoring/gi, label: "Credit scoring (high risk)" },
];

/**
 * Fetch and analyze a URL for AI compliance indicators
 */
export async function scanUrl(targetUrl: string): Promise<UrlScanResult> {
  // Validate URL
  const validated = urlSchema.safeParse(targetUrl);
  if (!validated.success) {
    throw new Error("Invalid URL provided");
  }

  const url = validated.data;

  // Fetch page content
  let pageContent = "";
  let pageTitle = "";
  let pageDescription = "";

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "EU-AI-Act-Compliance-Scanner/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    pageContent = await response.text();

    // Extract title
    const titleMatch = pageContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    pageTitle = titleMatch?.[1]?.trim() ?? "";

    // Extract meta description
    const descMatch = pageContent.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i
    );
    pageDescription = descMatch?.[1]?.trim() ?? "";
  } catch (fetchError) {
    // Return limited results if fetch fails
    return {
      url,
      scannedAt: new Date().toISOString(),
      overallScore: 0,
      checks: [
        {
          category: "Fetch Error",
          indicator: "Page Access",
          status: "fail",
          description: `Could not fetch the URL: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        },
      ],
      summary: "Unable to scan the URL. Please verify the URL is accessible and try again.",
    };
  }

  // Run compliance checks
  const checks: ComplianceCheck[] = [];

  // 1. AI Technology Detection
  const detectedAi: string[] = [];
  for (const indicator of AI_INDICATORS) {
    if (indicator.pattern.test(pageContent)) {
      detectedAi.push(indicator.label);
    }
  }

  checks.push({
    category: "AI Detection",
    indicator: "AI Technology Usage",
    status: detectedAi.length > 0 ? "warning" : "info",
    description: detectedAi.length > 0
      ? `Detected ${detectedAi.length} AI-related term(s) on the page.`
      : "No explicit AI technology mentions detected.",
    evidence: detectedAi.length > 0 ? detectedAi.join(", ") : undefined,
  });

  // 2. Transparency Checks
  const detectedTransparency: string[] = [];
  for (const indicator of TRANSPARENCY_INDICATORS) {
    if (indicator.pattern.test(pageContent)) {
      detectedTransparency.push(indicator.label);
    }
  }

  checks.push({
    category: "Transparency",
    indicator: "Disclosure & Documentation",
    status: detectedTransparency.length >= 4 ? "pass" : detectedTransparency.length >= 2 ? "warning" : "fail",
    description: detectedTransparency.length >= 4
      ? `Good transparency: ${detectedTransparency.length} compliance indicators found.`
      : detectedTransparency.length >= 2
        ? `Partial transparency: ${detectedTransparency.length} indicators found. More disclosure recommended.`
        : "Insufficient transparency indicators. Consider adding privacy policy, terms, and GDPR notices.",
    evidence: detectedTransparency.length > 0 ? detectedTransparency.join(", ") : undefined,
  });

  // 3. High-Risk / Prohibited Practice Checks
  const detectedRisks: string[] = [];
  for (const indicator of RISK_INDICATORS) {
    if (indicator.pattern.test(pageContent)) {
      detectedRisks.push(indicator.label);
    }
  }

  checks.push({
    category: "Risk Assessment",
    indicator: "High-Risk / Prohibited Practices",
    status: detectedRisks.length > 0 ? "fail" : "pass",
    description: detectedRisks.length > 0
      ? `Found ${detectedRisks.length} high-risk/prohibited indicator(s). Immediate review required.`
      : "No high-risk or prohibited practice indicators detected.",
    evidence: detectedRisks.length > 0 ? detectedRisks.join(", ") : undefined,
  });

  // 4. Basic Page Quality Checks
  checks.push({
    category: "Page Quality",
    indicator: "Page Title",
    status: pageTitle ? "pass" : "warning",
    description: pageTitle ? `Page title: "${pageTitle}"` : "No page title found. Add a descriptive title for transparency.",
  });

  checks.push({
    category: "Page Quality",
    indicator: "Meta Description",
    status: pageDescription ? "pass" : "warning",
    description: pageDescription
      ? `Meta description present (${pageDescription.length} characters).`
      : "No meta description found. Add a description for better transparency.",
  });

  // 5. Cookie Consent Check
  const hasCookieBanner =
    /cookie.*consent/gi.test(pageContent) ||
    /cookie.*banner/gi.test(pageContent) ||
    /cookie.*notice/gi.test(pageContent) ||
    /cookie.*preferences/gi.test(pageContent) ||
    /consent.*manage/gi.test(pageContent);

  checks.push({
    category: "GDPR Compliance",
    indicator: "Cookie Consent Mechanism",
    status: hasCookieBanner ? "pass" : "warning",
    description: hasCookieBanner
      ? "Cookie consent mechanism detected."
      : "No cookie consent mechanism detected. Required under GDPR for EU users.",
  });

  // 6. Language Accessibility
  const langMatch = pageContent.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const hasLang = langMatch?.[1] ? true : false;

  checks.push({
    category: "Accessibility",
    indicator: "Language Declaration",
    status: hasLang ? "pass" : "warning",
    description: hasLang
      ? `Language declared: ${langMatch?.[1]}`
      : "No language attribute on <html> element. Add lang attribute for accessibility compliance.",
  });

  // Calculate overall score
  const scoreMap = { pass: 100, warning: 50, fail: 0, info: 75 };
  const totalScore = Math.round(
    checks.reduce((sum, check) => sum + (scoreMap[check.status] ?? 50), 0) /
      checks.length
  );

  // Generate summary
  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  let summary: string;
  if (failCount > 0) {
    summary = `Scan found ${failCount} issue(s) requiring attention, ${warningCount} warning(s), and ${passCount} passed check(s). Review high-risk indicators and improve transparency disclosures.`;
  } else if (warningCount > 2) {
    summary = `Scan completed with ${warningCount} warning(s) and ${passCount} passed check(s). Consider addressing transparency and documentation gaps.`;
  } else {
    summary = `Scan completed successfully. ${passCount} of ${checks.length} checks passed. The page shows good compliance indicators.`;
  }

  return {
    url,
    scannedAt: new Date().toISOString(),
    overallScore: totalScore,
    checks,
    summary,
  };
}
