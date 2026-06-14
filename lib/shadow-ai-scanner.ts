// Shadow AI Scanner Service
// Real implementation: scans code snippets and dependency manifests for AI library usage
// Detects unauthorized "shadow AI" tools by analyzing package.json, requirements.txt, and source code
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
 * Known AI libraries with detection heuristics for code/package analysis
 */
const KNOWN_AI_LIBRARIES: Array<{
  name: string;
  category: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  npmPackages: string[];
  pipPackages: string[];
  importPatterns: RegExp[];
  apiKeyPatterns: RegExp[];
  recommendation: string;
}> = [
  {
    name: "OpenAI / ChatGPT",
    category: "Generative AI / LLM",
    riskLevel: "high",
    npmPackages: ["openai", "@openai/api", "chatgpt", "gpt-3", "gpt-4"],
    pipPackages: ["openai", "chatgpt", "gpt-3", "gpt-4"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]openai['"]/i,
      /require\s*\(\s*['"]openai['"]\s*\)/i,
      /from\s+openai\s+import/i,
      /import\s+openai/i,
    ],
    apiKeyPatterns: [/sk-[a-zA-Z0-9]{20,}/i, /OPENAI_API_KEY/i, /OPENAI_ORG_ID/i],
    recommendation:
      "Implement an approved enterprise AI policy. Use OpenAI Enterprise or Azure OpenAI with data residency guarantees. Rotate exposed API keys immediately.",
  },
  {
    name: "Anthropic / Claude",
    category: "Generative AI / LLM",
    riskLevel: "high",
    npmPackages: ["@anthropic-ai/sdk", "anthropic"],
    pipPackages: ["anthropic", "claude"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@anthropic-ai\/sdk['"]/i,
      /require\s*\(\s*['"]@anthropic-ai\/sdk['"]\s*\)/i,
      /from\s+anthropic\s+import/i,
      /import\s+anthropic/i,
    ],
    apiKeyPatterns: [/sk-ant-[a-zA-Z0-9]{20,}/i, /ANTHROPIC_API_KEY/i],
    recommendation:
      "Evaluate Anthropic Enterprise plans for data privacy. Implement access controls and logging for all Claude interactions. Rotate exposed API keys.",
  },
  {
    name: "Google Gemini / Vertex AI",
    category: "Generative AI / LLM",
    riskLevel: "high",
    npmPackages: ["@google/generative-ai", "@google-ai/generativelanguage", "google-gax"],
    pipPackages: ["google-generativeai", "google-cloud-aiplatform", "vertexai"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@google\/generative-ai['"]/i,
      /require\s*\(\s*['"]@google\/generative-ai['"]\s*\)/i,
      /from\s+google\.generativeai\s+import/i,
      /import\s+google\.generativeai/i,
      /import\s+vertexai/i,
    ],
    apiKeyPatterns: [/GOOGLE_API_KEY/i, /GOOGLE_AI_API_KEY/i, /GEMINI_API_KEY/i],
    recommendation:
      "Require Google Cloud Enterprise with AI privacy controls. Prohibit use of consumer API keys for business data. Enable audit logging.",
  },
  {
    name: "LangChain",
    category: "LLM Orchestration / Framework",
    riskLevel: "medium",
    npmPackages: ["langchain", "@langchain/core", "@langchain/openai", "@langchain/anthropic"],
    pipPackages: ["langchain", "langchain-core", "langchain-openai", "langchain-anthropic"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]langchain['"]/i,
      /require\s*\(\s*['"]langchain['"]\s*\)/i,
      /from\s+langchain\s+import/i,
      /import\s+langchain/i,
    ],
    apiKeyPatterns: [/LANGCHAIN_API_KEY/i, /LANGCHAIN_TRACING_V2/i],
    recommendation:
      "Review all LLM integrations configured through LangChain. Ensure data retention and logging policies are enforced across all chains.",
  },
  {
    name: "TensorFlow",
    category: "Machine Learning / Deep Learning",
    riskLevel: "medium",
    npmPackages: ["@tensorflow/tfjs", "@tensorflow/tfjs-node"],
    pipPackages: ["tensorflow", "tensorflow-cpu", "tensorflow-gpu", "tf-nightly"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@tensorflow\/tfjs['"]/i,
      /require\s*\(\s*['"]@tensorflow\/tfjs['"]\s*\)/i,
      /import\s+tensorflow\s+as\s+tf/i,
      /from\s+tensorflow\s+import/i,
    ],
    apiKeyPatterns: [],
    recommendation:
      "Document model training data sources and ensure GDPR compliance. Verify model cards are maintained for high-risk use cases.",
  },
  {
    name: "PyTorch",
    category: "Machine Learning / Deep Learning",
    riskLevel: "medium",
    npmPackages: ["torchjs"],
    pipPackages: ["torch", "torchvision", "torchaudio", "pytorch-lightning"],
    importPatterns: [
      /import\s+torch/i,
      /from\s+torch\s+import/i,
      /import\s+pytorch_lightning/i,
    ],
    apiKeyPatterns: [],
    recommendation:
      "Document model training pipelines and data governance practices. Ensure reproducibility and version control for models used in production.",
  },
  {
    name: "Hugging Face Transformers",
    category: "Generative AI / NLP",
    riskLevel: "medium",
    npmPackages: ["@huggingface/inference", "@huggingface/transformers"],
    pipPackages: ["transformers", "huggingface-hub", "datasets"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@huggingface\/inference['"]/i,
      /require\s*\(\s*['"]@huggingface\/inference['"]\s*\)/i,
      /from\s+transformers\s+import/i,
      /import\s+transformers/i,
    ],
    apiKeyPatterns: [/HF_TOKEN/i, /HUGGINGFACE_TOKEN/i, /HUGGING_FACE_HUB_TOKEN/i],
    recommendation:
      "Review model licenses and usage restrictions. Ensure EU data residency for inference endpoints. Rotate exposed tokens.",
  },
  {
    name: "Cohere",
    category: "Generative AI / NLP",
    riskLevel: "high",
    npmPackages: ["cohere-ai"],
    pipPackages: ["cohere"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]cohere-ai['"]/i,
      /require\s*\(\s*['"]cohere-ai['"]\s*\)/i,
      /import\s+cohere/i,
      /from\s+cohere\s+import/i,
    ],
    apiKeyPatterns: [/COHERE_API_KEY/i],
    recommendation:
      "Use Cohere Enterprise with data privacy guarantees. Implement output logging and content filtering for compliance.",
  },
  {
    name: "Stability AI / Stable Diffusion",
    category: "Generative AI / Image",
    riskLevel: "medium",
    npmPackages: ["stability-client"],
    pipPackages: ["stability-sdk", "diffusers"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]stability-client['"]/i,
      /from\s+stability_sdk\s+import/i,
      /import\s+diffusers/i,
      /from\s+diffusers\s+import/i,
    ],
    apiKeyPatterns: [/STABILITY_API_KEY/i, /STABILITY_KEY/i],
    recommendation:
      "Document all AI-generated image content. Ensure talent releases cover AI-modified likenesses per GDPR and image rights.",
  },
  {
    name: "Azure OpenAI",
    category: "Generative AI / LLM",
    riskLevel: "medium",
    npmPackages: ["@azure/openai", "@azure/ai-form-recognizer"],
    pipPackages: ["azure-openai", "azure-ai-ml"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@azure\/openai['"]/i,
      /require\s*\(\s*['"]@azure\/openai['"]\s*\)/i,
      /from\s+azure\.openai\s+import/i,
      /import\s+azure\.openai/i,
    ],
    apiKeyPatterns: [/AZURE_OPENAI_API_KEY/i, /AZURE_OPENAI_ENDPOINT/i],
    recommendation:
      "Leverage Azure's enterprise compliance certifications. Enable diagnostic logging and private endpoints for sensitive workloads.",
  },
  {
    name: "AWS Bedrock / SageMaker",
    category: "Generative AI / Cloud ML",
    riskLevel: "medium",
    npmPackages: ["@aws-sdk/client-bedrock-runtime", "@aws-sdk/client-sagemaker-runtime"],
    pipPackages: ["boto3", "sagemaker"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@aws-sdk\/client-bedrock-runtime['"]/i,
      /require\s*\(\s*['"]@aws-sdk\/client-bedrock-runtime['"]\s*\)/i,
      /import\s+boto3/i,
      /from\s+boto3\s+import/i,
      /import\s+sagemaker/i,
    ],
    apiKeyPatterns: [/AWS_ACCESS_KEY_ID/i, /AWS_SECRET_ACCESS_KEY/i],
    recommendation:
      "Ensure IAM policies follow least privilege. Enable CloudTrail logging for all Bedrock invocations. Review data processing agreements.",
  },
  {
    name: "Mistral AI",
    category: "Generative AI / LLM",
    riskLevel: "high",
    npmPackages: ["@mistralai/mistralai"],
    pipPackages: ["mistralai"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@mistralai\/mistralai['"]/i,
      /require\s*\(\s*['"]@mistralai\/mistralai['"]\s*\)/i,
      /from\s+mistralai\s+import/i,
      /import\s+mistralai/i,
    ],
    apiKeyPatterns: [/MISTRAL_API_KEY/i],
    recommendation:
      "Evaluate Mistral's enterprise offerings for data privacy. Implement output logging and access controls.",
  },
  {
    name: "Ollama / Local LLM",
    category: "Generative AI / Local Deployment",
    riskLevel: "low",
    npmPackages: ["ollama"],
    pipPackages: ["ollama"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]ollama['"]/i,
      /require\s*\(\s*['"]ollama['"]\s*\)/i,
      /import\s+ollama/i,
      /from\s+ollama\s+import/i,
    ],
    apiKeyPatterns: [/OLLAMA_HOST/i],
    recommendation:
      "Local deployment reduces data leakage risk. Ensure model weights are from trusted sources. Document usage for compliance.",
  },
  {
    name: "Pinecone / Vector DB",
    category: "AI Infrastructure / Vector Database",
    riskLevel: "medium",
    npmPackages: ["@pinecone-database/pinecone", "pinecone-client"],
    pipPackages: ["pinecone-client", "pinecone"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]@pinecone-database\/pinecone['"]/i,
      /require\s*\(\s*['"]@pinecone-database\/pinecone['"]\s*\)/i,
      /import\s+pinecone/i,
      /from\s+pinecone\s+import/i,
    ],
    apiKeyPatterns: [/PINECONE_API_KEY/i, /PINECONE_ENVIRONMENT/i],
    recommendation:
      "Review data stored in vector databases for PII. Ensure encryption at rest and in transit. Implement access controls.",
  },
  {
    name: "Weaviate / Vector DB",
    category: "AI Infrastructure / Vector Database",
    riskLevel: "medium",
    npmPackages: ["weaviate-ts-client", "weaviate-client"],
    pipPackages: ["weaviate-client"],
    importPatterns: [
      /import\s+.*\s+from\s+['"]weaviate-ts-client['"]/i,
      /require\s*\(\s*['"]weaviate-ts-client['"]\s*\)/i,
      /import\s+weaviate/i,
      /from\s+weaviate\s+import/i,
    ],
    apiKeyPatterns: [/WEAVIATE_API_KEY/i],
    recommendation:
      "Audit vector database contents for sensitive data. Ensure compliance with GDPR data minimization principles.",
  },
];

/**
 * Input validation schema
 */
const scanInputSchema = z.object({
  organization: z.string().min(1, "Organization name is required").max(200, "Organization name too long"),
  domain: z.string().max(253, "Domain too long").optional(),
  codeSnippet: z.string().max(50000, "Code snippet too large").optional(),
  packageJson: z.string().max(50000, "package.json too large").optional(),
  requirements: z.string().max(50000, "requirements.txt too large").optional(),
});

/**
 * Parse package.json and extract dependency names
 */
function parsePackageJson(content: string): string[] {
  try {
    const pkg = JSON.parse(content);
    const deps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    return deps.map((d) => d.toLowerCase());
  } catch {
    return [];
  }
}

/**
 * Parse requirements.txt and extract package names
 */
function parseRequirementsTxt(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const packages: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
    // Extract package name before version specifiers
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)/);
    if (match) {
      packages.push(match[1]!.toLowerCase());
    }
  }
  return packages;
}

/**
 * Check if any known AI library is present in dependency lists
 */
function detectFromDependencies(
  npmDeps: string[],
  pipDeps: string[]
): Array<{ library: (typeof KNOWN_AI_LIBRARIES)[number]; matchedPackages: string[] }> {
  const results: Array<{ library: (typeof KNOWN_AI_LIBRARIES)[number]; matchedPackages: string[] }> = [];

  for (const library of KNOWN_AI_LIBRARIES) {
    const matchedPackages: string[] = [];

    for (const dep of npmDeps) {
      for (const pkg of library.npmPackages) {
        if (dep === pkg.toLowerCase() || dep.startsWith(pkg.toLowerCase() + "/")) {
          matchedPackages.push(dep);
        }
      }
    }

    for (const dep of pipDeps) {
      for (const pkg of library.pipPackages) {
        if (dep === pkg.toLowerCase()) {
          matchedPackages.push(dep);
        }
      }
    }

    if (matchedPackages.length > 0) {
      results.push({ library, matchedPackages: [...new Set(matchedPackages)] });
    }
  }

  return results;
}

/**
 * Scan code snippet for AI library imports and API keys
 */
function detectFromCode(
  code: string
): Array<{
  library: (typeof KNOWN_AI_LIBRARIES)[number];
  matchedImports: string[];
  matchedApiKeys: string[];
}> {
  const results: Array<{
    library: (typeof KNOWN_AI_LIBRARIES)[number];
    matchedImports: string[];
    matchedApiKeys: string[];
  }> = [];

  for (const library of KNOWN_AI_LIBRARIES) {
    const matchedImports: string[] = [];
    const matchedApiKeys: string[] = [];

    for (const pattern of library.importPatterns) {
      const matches = code.match(new RegExp(pattern, "g"));
      if (matches) {
        matchedImports.push(...matches.slice(0, 5)); // Limit to 5 examples
      }
    }

    for (const pattern of library.apiKeyPatterns) {
      const matches = code.match(new RegExp(pattern, "g"));
      if (matches) {
        matchedApiKeys.push(...matches.slice(0, 5));
      }
    }

    if (matchedImports.length > 0 || matchedApiKeys.length > 0) {
      results.push({
        library,
        matchedImports: [...new Set(matchedImports)],
        matchedApiKeys: [...new Set(matchedApiKeys)],
      });
    }
  }

  return results;
}

/**
 * Detect generic API key leaks in code
 */
function detectGenericApiKeys(code: string): string[] {
  const genericPatterns = [
    /['"]sk-[a-zA-Z0-9]{20,}['"]/gi,
    /['"]sk-ant-[a-zA-Z0-9]{20,}['"]/gi,
    /['"]hf_[a-zA-Z0-9]{20,}['"]/gi,
    /['"]AKIA[0-9A-Z]{16}['"]/gi,
    /['"]ghp_[a-zA-Z0-9]{36}['"]/gi,
    /['"]gho_[a-zA-Z0-9]{36}['"]/gi,
    /['"]xox[baprs]-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24}['"]/gi,
  ];

  const findings: string[] = [];
  for (const pattern of genericPatterns) {
    const matches = code.match(pattern);
    if (matches) {
      findings.push(...matches.slice(0, 3));
    }
  }
  return [...new Set(findings)];
}

/**
 * Assess data governance concerns based on detected libraries
 */
function assessDataGovernance(
  detectedTools: DetectedTool[],
  apiKeyFindings: string[]
): { concerns: string[]; scoreImpact: number } {
  const concerns: string[] = [];
  let scoreImpact = 0;

  const highRiskCategories = ["Generative AI / LLM", "Generative AI / NLP"];
  const hasHighRiskLLM = detectedTools.some(
    (t) => highRiskCategories.includes(t.category) && (t.riskLevel === "high" || t.riskLevel === "critical")
  );

  if (hasHighRiskLLM) {
    concerns.push(
      "High-risk LLM integrations detected. Ensure data processing agreements cover EU AI Act Art.10 data governance requirements."
    );
    scoreImpact += 15;
  }

  const hasVectorDB = detectedTools.some((t) => t.category.includes("Vector Database"));
  if (hasVectorDB) {
    concerns.push(
      "Vector databases may store embeddings derived from personal data. Verify GDPR Art.6 lawful basis and data subject rights compliance."
    );
    scoreImpact += 10;
  }

  if (apiKeyFindings.length > 0) {
    concerns.push(
      `Potential API key exposure detected (${apiKeyFindings.length} instance(s)). Immediate rotation and secret management review required.`
    );
    scoreImpact += 20;
  }

  const hasLocalLLM = detectedTools.some((t) => t.name.includes("Local"));
  const hasCloudLLM = detectedTools.some(
    (t) => t.category.includes("LLM") && !t.name.includes("Local")
  );
  if (hasCloudLLM && !hasLocalLLM) {
    concerns.push(
      "Cloud-based LLM usage without local alternatives increases data sovereignty risk. Consider on-premise options for sensitive data."
    );
    scoreImpact += 5;
  }

  return { concerns, scoreImpact };
}

/**
 * Generate remediation steps based on findings
 */
function generateRemediationSteps(
  detectedTools: DetectedTool[],
  governanceConcerns: string[]
): string[] {
  const steps: string[] = [
    "Create an approved AI tool list and communicate it to all engineering teams.",
    "Update Acceptable Use Policy (AUP) to explicitly cover generative AI and LLM usage.",
    "Implement pre-commit hooks (e.g., detect-secrets, git-secrets) to prevent API key leaks.",
    "Deploy enterprise versions of approved AI tools with data residency and audit logging.",
    "Conduct developer training on EU AI Act implications of unauthorized AI library usage.",
    "Set up quarterly dependency audits and integrate findings into your risk register.",
  ];

  const hasHighRisk = detectedTools.some((t) => t.riskLevel === "high" || t.riskLevel === "critical");
  if (hasHighRisk) {
    steps.unshift(
      "URGENT: Review all high-risk AI integrations for GDPR and EU AI Act compliance. Block unauthorized consumer-tier APIs."
    );
  }

  if (governanceConcerns.some((c) => c.includes("API key"))) {
    steps.unshift(
      "URGENT: Rotate all exposed API keys immediately. Implement secret management (e.g., AWS Secrets Manager, Azure Key Vault)."
    );
  }

  if (detectedTools.some((t) => t.category.includes("Vector Database"))) {
    steps.push(
      "Audit vector database schemas and content for PII. Implement data retention policies per GDPR Art.5(1)(e)."
    );
  }

  if (detectedTools.some((t) => t.name.includes("TensorFlow") || t.name.includes("PyTorch"))) {
    steps.push(
      "Document ML model cards including training data provenance, performance metrics, and bias assessments."
    );
  }

  return steps;
}

/**
 * Real shadow AI detection: analyzes code and dependencies
 */
export async function scanShadowAI(
  organization: string,
  domain?: string,
  codeSnippet?: string,
  packageJson?: string,
  requirements?: string
): Promise<ShadowAIScanResult> {
  const validated = scanInputSchema.safeParse({
    organization,
    domain,
    codeSnippet,
    packageJson,
    requirements,
  });

  if (!validated.success) {
    throw new Error(validated.error.errors.map((e) => e.message).join(", "));
  }

  const org = validated.data.organization.trim();
  const orgDomain = domain?.trim() || `${org.toLowerCase().replace(/\s+/g, "-")}.com`;

  // Parse dependencies
  const npmDeps = packageJson ? parsePackageJson(packageJson) : [];
  const pipDeps = requirements ? parseRequirementsTxt(requirements) : [];

  // Detect from dependencies
  const depDetections = detectFromDependencies(npmDeps, pipDeps);

  // Detect from code
  const codeDetections = codeSnippet ? detectFromCode(codeSnippet) : [];

  // Generic API key detection
  const allCode = [codeSnippet ?? "", packageJson ?? "", requirements ?? ""].join("\n");
  const genericApiKeys = detectGenericApiKeys(allCode);

  // Merge detections into unique tool list
  const toolMap = new Map<string, DetectedTool>();

  for (const detection of depDetections) {
    const lib = detection.library;
    const existing = toolMap.get(lib.name);
    const indicators = [`Package: ${detection.matchedPackages.join(", ")}`];

    if (existing) {
      existing.indicators = [...new Set([...existing.indicators, ...indicators])];
      existing.confidence = Math.min(100, existing.confidence + 20);
    } else {
      toolMap.set(lib.name, {
        name: lib.name,
        category: lib.category,
        confidence: 85,
        riskLevel: lib.riskLevel,
        indicators,
        recommendation: lib.recommendation,
      });
    }
  }

  for (const detection of codeDetections) {
    const lib = detection.library;
    const existing = toolMap.get(lib.name);
    const indicators: string[] = [];

    if (detection.matchedImports.length > 0) {
      indicators.push(`Import: ${detection.matchedImports.slice(0, 2).join(", ")}`);
    }
    if (detection.matchedApiKeys.length > 0) {
      indicators.push(`API key pattern detected`);
    }

    if (existing) {
      existing.indicators = [...new Set([...existing.indicators, ...indicators])];
      existing.confidence = Math.min(100, existing.confidence + 15);
    } else {
      toolMap.set(lib.name, {
        name: lib.name,
        category: lib.category,
        confidence: detection.matchedImports.length > 0 ? 80 : 60,
        riskLevel: lib.riskLevel,
        indicators,
        recommendation: lib.recommendation,
      });
    }
  }

  // Convert map to array and sort by risk
  const detectedTools = Array.from(toolMap.values());
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  detectedTools.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  // Data governance assessment
  const governance = assessDataGovernance(detectedTools, genericApiKeys);

  // Calculate risk score
  let riskScore = 0;
  if (detectedTools.length > 0) {
    const riskWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    const rawScore = detectedTools.reduce((sum, t) => sum + riskWeights[t.riskLevel], 0);
    riskScore = Math.min(100, rawScore + governance.scoreImpact);
  } else {
    riskScore = Math.min(10, governance.scoreImpact);
  }

  // Generate summary
  const criticalCount = detectedTools.filter((t) => t.riskLevel === "critical").length;
  const highCount = detectedTools.filter((t) => t.riskLevel === "high").length;
  const mediumCount = detectedTools.filter((t) => t.riskLevel === "medium").length;

  let summary: string;
  if (detectedTools.length === 0 && governance.concerns.length === 0) {
    summary = `No AI libraries or API keys were detected in the provided code for "${org}". Continue monitoring dependencies and conduct periodic code reviews.`;
  } else if (criticalCount > 0 || highCount > 2) {
    summary = `Significant shadow AI risk detected for "${org}". Found ${detectedTools.length} unauthorized AI library/ies including ${criticalCount} critical and ${highCount} high-risk. ${governance.concerns.length} data governance concern(s) identified. Immediate policy review and access controls are strongly recommended.`;
  } else if (highCount > 0 || mediumCount > 2) {
    summary = `Moderate shadow AI risk detected for "${org}". Found ${detectedTools.length} AI library/ies including ${highCount} high-risk and ${mediumCount} medium-risk. ${governance.concerns.length} data governance concern(s) identified. Review and approve tools through your IT governance process.`;
  } else {
    summary = `Low to moderate shadow AI risk for "${org}". Found ${detectedTools.length} low/medium risk AI library/ies. ${governance.concerns.length} data governance concern(s) identified. Continue monitoring and ensure all AI usage is documented in your AI system inventory.`;
  }

  // Append governance concerns to summary if any
  if (governance.concerns.length > 0) {
    summary += "\n\nData Governance Concerns:\n" + governance.concerns.map((c) => `- ${c}`).join("\n");
  }

  // Remediation steps
  const remediationSteps = generateRemediationSteps(detectedTools, governance.concerns);

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
