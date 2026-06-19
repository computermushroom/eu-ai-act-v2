// OpenAI LLM 提供商实现
// 通过 fetch 调用 OpenAI Chat Completions API
// 环境变量: OPENAI_API_KEY (必需), OPENAI_MODEL (可选, 默认 gpt-4o-mini)

import type { LLMMessage, LLMConfig, LLMResponse, LLMProvider } from "./types";

/**
 * OpenAI API 响应格式
 */
interface OpenAIChoice {
  message: {
    content: string | null;
    role: string;
  };
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponseBody {
  choices: OpenAIChoice[];
  model: string;
  usage?: OpenAIUsage;
}

/**
 * OpenAI 提供商
 * 实现 LLMProvider 接口，调用 OpenAI Chat Completions API
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  private readonly apiKey: string | undefined;
  private readonly defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.defaultModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  isConfigured(): boolean {
    return typeof this.apiKey === "string" && this.apiKey.length > 0;
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.");
    }

    const model = config.model ?? this.defaultModel;

    const requestBody: Record<string, unknown> = {
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: config.temperature ?? 0.3,
      max_tokens: config.maxTokens ?? 1200,
      top_p: config.topP ?? 1,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      const errorDetail = (errorData?.error as Record<string, unknown>)?.message ?? `OpenAI API error: ${response.status}`;
      throw new Error(String(errorDetail));
    }

    const data = (await response.json()) as OpenAIResponseBody;
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    return {
      content,
      model: data.model ?? model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
