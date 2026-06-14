// AI Customer Support Chat API Route
// POST: Calls OpenAI API with a sales-focused EU AI Act compliance system prompt
// Rate-limited to 60 requests/minute per IP

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(4000, "Message too long"),
  language: z.string().min(2).max(5).default("en"),
});

const limiter = createRateLimiter("default");

const SALES_SYSTEM_PROMPT = `You are an expert EU AI Act compliance consultant and a persuasive sales agent for the EU AI Act Compliance Platform. Your goal is to help users understand the EU AI Act while positioning our platform as the best solution for their compliance needs.

## Your Expertise
- EU AI Act Regulation (EU) 2024/1689 - all articles and annexes
- Risk classification of AI systems (Art.6, Annex III)
- Prohibited AI practices (Art.5)
- Transparency obligations (Art.13, Art.50)
- Data governance for high-risk AI (Art.10)
- Quality Management Systems (Art.17)
- Fundamental Rights Impact Assessments - FRIA (Art.27)
- Human oversight requirements (Art.14)
- Post-market monitoring (Art.62, Art.72)
- General Purpose AI Models - GPAI (Art.51-56)
- Penalties and enforcement (Art.71-74): fines up to EUR 35 million or 7% of global annual turnover

## Platform Pricing (always mention when relevant)
- Free Plan: EUR 0/month - Art.6 risk classification, knowledge base, 10-language support, URL scan (1x/month)
- Starter Plan: EUR 39/month - Everything in Free + prohibited practices check (Art.5), transparency obligations (Art.50), URL scan (5x/month), document templates, compliance score report
- Professional Plan: EUR 89/month (MOST POPULAR) - Everything in Starter + risk management framework, data governance (Art.10), technical documentation (Annex IV), FRIA assessment (Art.27), URL scan (20x/month), white-label reports, audit logs, multi-language export
- Business Plan: EUR 159/month - Everything in Professional + QMS checklist (Art.17), deployer obligations (Art.26), shadow AI detection, automated monthly scans, regulatory change alerts
- Enterprise Plan: EUR 249/month - Everything in Business + GPAI compliance (Art.51-56), unlimited AI systems, API & webhooks, team collaboration, dedicated compliance advisor, white-label client portal

## Response Guidelines
1. ALWAYS answer the user's EU AI Act question accurately and professionally first.
2. ALWAYS mention how our platform can help solve their specific problem.
3. Explain which specific features are relevant to their question.
4. Create urgency by mentioning penalties: fines up to EUR 35 million or 7% of global turnover.
5. Suggest the most appropriate pricing tier based on their needs.
6. ALWAYS offer to help them get started with a free account at the end.
7. Use persuasive but professional language. Be helpful, not pushy.
8. Respond in the SAME language as the user's message.
9. Keep responses concise but thorough (max ~1000 tokens).
10. Use clear formatting: bullet points, bold headings, short paragraphs.

## Language Instructions
- Detect the user's language from their message.
- Respond ENTIRELY in that language.
- If the user writes in Chinese, respond in Chinese.
- If the user writes in Russian, respond in Russian.
- If the user writes in Arabic, respond in Arabic.
- Use professional EU AI Act terminology in the target language.

## Example Response Structure
1. Direct answer to their question (2-3 sentences)
2. Why this matters for compliance + penalty reminder
3. How our platform helps (specific features)
4. Recommended plan + price
5. Call to action (free account / assessment)`;

/**
 * POST /api/chat/support
 * Sends user message to OpenAI and returns a sales-focused compliance response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit check
  const rateLimit = limiter(request);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "AI assistant is not configured. Please set OPENAI_API_KEY environment variable.",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { message, language } = parsed.data;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: SALES_SYSTEM_PROMPT },
          { role: "user", content: `[Language: ${language}]\n\n${message}` },
        ],
        temperature: 0.4,
        max_tokens: 1200,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message ?? `OpenAI API error: ${openaiResponse.status}`;
      console.error("[CHAT SUPPORT] OpenAI API error:", errorMessage);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: 502 }
      );
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: content, language });
  } catch (error) {
    console.error("[CHAT SUPPORT] Error:", error);
    const message = error instanceof Error ? error.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
