// AI Assistant API Route
// POST: Calls LLM provider (OpenAI / Anthropic) with EU AI Act compliance system prompt
// Provider selection controlled by LLM_PROVIDER environment variable
// Rate-limited to 30 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { createRateLimiter } from "@/lib/rate-limit";
import { requireTier } from "@/lib/subscription-guard";
import { getLLMProvider } from "@/lib/llm";

const aiAssistantSchema = z.object({
  message: z.string().min(1, "Message is required").max(8000, "Message too long"),
  systemContext: z.string().max(2000, "Context too long").optional(),
});

const limiter = createRateLimiter("default");

const SYSTEM_PROMPT = `You are an expert EU AI Act compliance assistant. Your role is to help organizations understand and comply with Regulation (EU) 2024/1689 (the EU AI Act).

Your expertise covers:
- Risk classification of AI systems (Art.6, Annex III)
- Prohibited AI practices (Art.5)
- Transparency obligations for providers and deployers (Art.13, Art.50)
- Data governance requirements for high-risk AI (Art.10)
- Quality Management Systems (Art.17)
- Fundamental Rights Impact Assessments (Art.27)
- Human oversight requirements (Art.14)
- Post-market monitoring and incident reporting (Art.62, Art.72)
- General Purpose AI Models (Art.52-56)
- Penalties and enforcement timelines (Art.71-74)

Guidelines:
- Always cite specific articles and sections where relevant.
- Use clear, structured formatting (bullet points, numbered lists, bold headings).
- If a question is outside EU AI Act scope, politely redirect to the relevant topic.
- Do not provide legal advice; remind users to consult qualified legal counsel for specific situations.
- Keep responses concise but thorough (max ~800 tokens).
- When discussing risk levels, explain the criteria and provide examples.
- Mention enforcement dates and deadlines accurately.`;

/**
 * POST /api/ai-assistant
 * Sends user message to the configured LLM provider and returns compliance-focused response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tierCheck = await requireTier("free")(request);
  if (tierCheck) return tierCheck;

  // Rate limit check
  const rateLimit = limiter(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const provider = getLLMProvider();

  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        error: `AI assistant is not configured. Please set the required API key for the ${provider.name} provider.`,
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = aiAssistantSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { message, systemContext } = parsed.data;

    const userSystemPrompt = systemContext
      ? `${SYSTEM_PROMPT}\n\nAdditional context: ${systemContext}`
      : SYSTEM_PROMPT;

    const llmResponse = await provider.chat(
      [
        { role: "system", content: userSystemPrompt },
        { role: "user", content: message },
      ],
      {
        model: provider.name === "anthropic"
          ? (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514")
          : (process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
        temperature: 0.3,
        maxTokens: 1200,
        topP: 1,
      }
    );

    const content = llmResponse.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // Audit log (non-blocking)
    await createAuditLog({
      userId: session.user.id,
      action: "tool_specialized_checks",
      resource: "ai-assistant",
      details: {
        messageLength: message.length,
        responseLength: content.length,
        model: llmResponse.model,
        provider: provider.name,
      },
    });

    return NextResponse.json({ response: content });
  } catch (error) {
    console.error(`[AI ASSISTANT] ${provider.name} error:`, error);
    const message = error instanceof Error ? error.message : "Assistant request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
