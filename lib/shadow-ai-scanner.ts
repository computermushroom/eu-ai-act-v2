// Shadow AI Scanner Service
// Simulates scanning for unauthorized "shadow AI" tools in an organization
// Uses heuristic-based simulation (no actual network scanning)
//
// Shadow AI refers to AI tools used by employees without IT approval,
// creating compliance risks under the EU AI Act.

import { z } from "zod";

/**
 * Detected AI tool entry
 */
export interface DetectedTool {
  name: string;
  category: string;
  confidence: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  indicators: string[];
  recommendation: string;
}

/**
 * Shadow AI scan result
 */
export interface ShadowAIScanResult {
  organization: string;
  domain: string;
  scannedAt: string;
  riskScore: number; // 0-100 (higher = more risk)
  detectedTools: DetectedTool[];
  summary: string;
  remediationSteps: string[];
}

/**
 * Known AI tools with detection heuristics
 */
const KNOWN_AI_TOOLS: Array<{
  name: string;
  category: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  keywords: string[];
  recommendation: string;
}> = [
  {
    name: "ChatGPT / OpenAI",
    category: "Generative AI / LLM",
    riskLevel: "high",
    keywords: ["chatgpt", "openai", "gpt-4", "gpt-3", "chat.openai.com"],
    recommendation:
      "Implement an approved enterprise AI policy. Consider OpenAI Enterprise or Microsoft Copilot with data residency guarantees. Block consumer ChatGPT for work data.",
  },
  {
    name: "Microsoft Copilot",
    category: "Generative AI / Productivity",
    riskLevel: "medium",
    keywords: ["copilot", "github copilot", "microsoft copilot", "365 copilot"],
    recommendation:
      "Ensure Commercial Data Protection is enabled. Review data processing agreements with Microsoft. Disable web grounding if sensitive data is involved.",
  },
  {
    name: "Google Gemini / Bard",
    category: "Generative AI / LLM",
    riskLevel: "high",
    keywords: ["gemini", "bard", "google gemini", "gemini.google"],
    recommendation:
      "Require Google Workspace Enterprise license with AI privacy controls. Prohibit use of consumer Gemini accounts for business data.",
  },
  {
    name: "Midjourney",
    category: "Generative AI / Image",
    riskLevel: "medium",
    keywords: ["midjourney", "midjourney.com", "discord.gg/midjourney"],
    recommendation:
      "Establish IP ownership policies for AI-generated images. Ensure commercial license tier is used. Review terms for EU data residency.",
  },
  {
    name: "DALL-E",
    category: "Generative AI / Image",
    riskLevel: "medium",
    keywords: ["dall-e", "dalle", "openai image"],
    recommendation:
      "Use via OpenAI Enterprise API with content moderation. Document all generated assets for copyright compliance.",
  },
  {
    name: "Claude (Anthropic)",
    category: "Generative AI / LLM",
    riskLevel: "high",
    keywords: ["claude", "anthropic", "claude.ai"],
    recommendation:
      "Evaluate Anthropic Enterprise plans for data privacy. Implement access controls and logging for all Claude interactions.",
  },
  {
    name: "Perplexity AI",
    category: "Generative AI / Search",
    riskLevel: "high",
    keywords: ["perplexity", "perplexity.ai"],
    recommendation:
      "Queries may be stored and used for training. Block for confidential research. Use enterprise tier with data retention controls if approved.",
  },
  {
    name: "Notion AI",
    category: "Generative AI / Productivity",
    riskLevel: "medium",
    keywords: ["notion ai", "notion.so/ai"],
    recommendation:
      "Enable Notion Enterprise with AI data privacy settings. Ensure EU data residency is selected. Disable AI for sensitive workspaces.",
  },
  {
    name: "Jasper / Copy.ai",
    category: "Generative AI / Marketing",
    riskLevel: "medium",
    keywords: ["jasper", "copy.ai", "jasper.ai", "copyai"],
    recommendation:
      "Review DPA for EU data transfers. Ensure marketing content is reviewed for EU consumer protection compliance before publication.",
  },
  {
    name: "GitHub Copilot",
    category: "Generative AI / Code",
    riskLevel: "low",
    keywords: ["github copilot", "copilot github"],
    recommendation:
      "Enable organization-wide policies. Block suggestions matching public code to reduce IP risk. Use Copilot Business with audit logs.",
  },
  {
    name: "Tabnine",
    category: "Generative AI / Code",
    riskLevel: "low",
    keywords: ["tabnine", "tabnine.com"],
    recommendation:
      "Prefer self-hosted or enterprise cloud deployment. Verify code never leaves on-premise for sensitive projects.",
  },
  {
    name: "Replit Ghostwriter",
    category: "Generative AI / Code",
    riskLevel: "medium",
    keywords: ["replit", "ghostwriter", "replit ai"],
    recommendation:
      "Avoid for proprietary code. Use only for public/open-source projects. Evaluate data retention and training policies.",
  },
  {
    name: "Runway ML",
    category: "Generative AI / Video",
    riskLevel: "medium",
    keywords: ["runway", "runwayml", "runway ml"],
    recommendation:
      "Document all AI-generated video content. Ensure talent releases cover AI-modified likenesses per GDPR and image rights.",
  },
  {
    name: "Sora (OpenAI)",
    category: "Generative AI / Video",
    riskLevel: "high",
    keywords: ["sora", "openai sora"],
    recommendation:
      "High risk for deepfake/misuse. Implement strict approval workflows. Ensure watermarking and provenance tracking.",
  },
  {
    name: "DeepL",
    category: "AI / Translation",
    riskLevel: "low",
    keywords: ["deepl", "deepl.com", "deep translator"],
    recommendation:
      "Use DeepL Pro with data confidentiality enabled. Verify text is not stored or used for model training.",
  },
  {
    name: "Grammarly",
    category: "AI / Writing Assistant",
    riskLevel: "medium",
    keywords: ["grammarly", "grammarly.com"],
    recommendation:
      "Deploy Grammarly Business with enterprise data controls. Disable generative AI features if not approved. Block browser extension for sensitive roles.",
  },
  {
    name: "Otter.ai",
    category: "AI / Transcription",
    riskLevel: "high",
    keywords: ["otter.ai", "otter ai", "otter transcription"],
    recommendation:
      "Transcripts may contain personal data requiring GDPR compliance. Use enterprise tier with EU data storage. Obtain consent for recording.",
  },
  {
    name: "Fireflies.ai",
    category: "AI / Meeting Assistant",
    riskLevel: "high",
    keywords: ["fireflies", "fireflies.ai"],
    recommendation:
      "Meeting recordings require explicit consent under GDPR. Implement data retention policies. Evaluate EU data residency options.",
  },
  {
    name: "Tome",
    category: "Generative AI / Presentation",
    riskLevel: "low",
    keywords: ["tome", "tome.app", "tome ai"],
    recommendation:
      "Review content for accuracy before external use. Ensure generated presentations do not contain hallucinated legal or compliance claims.",
  },
  {
    name: "Stable Diffusion (Local)",
    category: "Generative AI / Image",
    riskLevel: "low",
    keywords: ["stable diffusion", "stability ai", "sdxl", "comfyui"],
    recommendation:
      "Local deployment is lower risk for data leakage. Ensure model weights are from trusted sources. Document usage for IP compliance.",
  },
];

/**
 * Organization validation schema
 */
const orgSchema = z
  .string()
  .min(1, "Organization name is required")
  .max(200, "Organization name too long");

/**
 * Deterministic pseudo-random generator based on string seed
 * Ensures same organization gets consistent (but fake) results
 */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

/**
 * Simulate shadow AI detection for an organization
 * No actual network scanning - purely heuristic simulation
 */
export async function scanShadowAI(
  organization: string,
  domain?: string
): Promise<ShadowAIScanResult> {
  const validated = orgSchema.safeParse(organization);
  if (!validated.success) {
    throw new Error("Invalid organization name provided");
  }

  const org = validated.data.trim();
  const orgDomain = domain?.trim() || `${org.toLowerCase().replace(/\s+/g, "-")}.com`;
  const rand = seededRandom(org.toLowerCase() + orgDomain);

  // Simulate detection: each tool has a chance of being "detected"
  const detectedTools: DetectedTool[] = [];

  for (const tool of KNOWN_AI_TOOLS) {
    // Base detection probability varies by tool popularity/risk
    const baseProbability =
      tool.riskLevel === "critical"
        ? 0.15
        : tool.riskLevel === "high"
          ? 0.35
          : tool.riskLevel === "medium"
            ? 0.45
            : 0.3;

    // Add some randomness per organization
    const orgFactor = rand();
    const isDetected = orgFactor < baseProbability;

    if (isDetected) {
      const confidence = Math.min(
        100,
        Math.round(60 + rand() * 35)
      );
      const indicatorCount = 1 + Math.floor(rand() * 3);
      const indicators = tool.keywords.slice(0, indicatorCount);

      detectedTools.push({
        name: tool.name,
        category: tool.category,
        confidence,
        riskLevel: tool.riskLevel,
        indicators,
        recommendation: tool.recommendation,
      });
    }
  }

  // Sort by risk level (critical first)
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  detectedTools.sort(
    (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
  );

  // Calculate overall risk score (0-100)
  let riskScore = 0;
  if (detectedTools.length > 0) {
    const riskWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    const rawScore = detectedTools.reduce(
      (sum, t) => sum + riskWeights[t.riskLevel],
      0
    );
    riskScore = Math.min(100, rawScore + Math.round(rand() * 10));
  } else {
    // Even with no detected tools, small baseline risk
    riskScore = Math.round(rand() * 10);
  }

  // Generate summary
  const criticalCount = detectedTools.filter((t) => t.riskLevel === "critical").length;
  const highCount = detectedTools.filter((t) => t.riskLevel === "high").length;
  const mediumCount = detectedTools.filter((t) => t.riskLevel === "medium").length;

  let summary: string;
  if (detectedTools.length === 0) {
    summary = `No common shadow AI tools were detected for "${org}". This is a positive sign, but does not guarantee complete coverage. Consider running periodic scans and implementing network monitoring for comprehensive visibility.`;
  } else if (criticalCount > 0 || highCount > 2) {
    summary = `Significant shadow AI risk detected for "${org}". Found ${detectedTools.length} unauthorized tool(s) including ${criticalCount} critical and ${highCount} high-risk application(s). Immediate policy review and access controls are strongly recommended.`;
  } else if (highCount > 0 || mediumCount > 2) {
    summary = `Moderate shadow AI risk detected for "${org}". Found ${detectedTools.length} tool(s) including ${highCount} high-risk and ${mediumCount} medium-risk application(s). Review and approve tools through your IT governance process.`;
  } else {
    summary = `Low to moderate shadow AI risk for "${org}". Found ${detectedTools.length} low/medium risk tool(s). Continue monitoring and ensure all AI usage is documented in your AI system inventory.`;
  }

  // Generate remediation steps
  const remediationSteps: string[] = [
    "Create an approved AI tool list and communicate it to all employees.",
    "Update Acceptable Use Policy (AUP) to explicitly cover generative AI and LLM usage.",
    "Implement network-level blocking for unapproved AI SaaS platforms (consumer tiers).",
    "Deploy enterprise versions of approved AI tools with data residency and audit logging.",
    "Conduct employee training on EU AI Act implications of unauthorized AI use.",
    "Set up quarterly shadow AI scans and integrate findings into your risk register.",
  ];

  if (highCount > 0 || criticalCount > 0) {
    remediationSteps.unshift(
      "URGENT: Block consumer-tier ChatGPT, Claude, and Gemini access from corporate networks until enterprise agreements are in place."
    );
  }

  if (detectedTools.some((t) => t.category.includes("Code"))) {
    remediationSteps.push(
      "Review source code for AI-generated snippets and ensure license compatibility."
    );
  }

  if (detectedTools.some((t) => t.category.includes("Meeting") || t.category.includes("Transcription"))) {
    remediationSteps.push(
      "Obtain explicit consent from all meeting participants before using AI transcription tools (GDPR Art.6/9)."
    );
  }

  return {
    organization: org,
    domain: orgDomain,
    scannedAt: new Date().toISOString(),
    riskScore,
    detectedTools,
    summary,
    remediationSteps,
  };
}
