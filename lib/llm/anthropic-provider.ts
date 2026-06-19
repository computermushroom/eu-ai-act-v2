// Anthropic Claude LLM 提供商实现
// 通过 fetch 调用 Anthropic Messages API
// 环境变量: ANTHROPIC_API_KEY (必需), ANTHROPIC_MODEL (可选, 默认 claude-sonnet-4-20250514)
// 注意: Anthropic API 与 OpenAI 格式不同，system 消息作为单独参数传递

import type { LLMMessage, LLMConfig, LLMResponse, LLMProvider } from "./types";

/**
 * Anthropic API 响应格式
 */
interface AnthropicContentBlock {
  type: string;
  text: string;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponseBody {
  content: AnthropicContentBlock[];
  model: string;
  usage?: AnthropicUsage;
}

/**
 * Anthropic Claude 提供商
 * 实现 LLMProvider 接口，调用 Anthropic Messages API
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";

  private readonly apiKey: string | undefined;
  private readonly defaultModel: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.defaultModel = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  }

  isConfigured(): boolean {
    return typeof this.apiKey === "string" && this.apiKey.length > 0;
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key is not configured. Please set the ANTHROPIC_API_KEY environment variable.");
    }

    const model = config.model ?? this.defaultModel;

    // Anthropic API 要求 system 作为单独参数，不是 messages 的一部分
    let systemPrompt: string | undefined;
    const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else {
        apiMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    const requestBody: Record<string, unknown> = {
      model,
      messages: apiMessages,
      max_tokens: config.maxTokens ?? 1200,
      temperature: config.temperature ?? 0.3,
      top_p: config.topP ?? 1,
    };

    // 仅在存在 system 消息时添加 system 参数
    if (systemPrompt !== undefined) {
      requestBody.system = systemPrompt;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      const errorDetail = (errorData?.error as Record<string, unknown>)?.message ?? `Anthropic API error: ${response.status}`;
      throw new Error(String(errorDetail));
    }

    const data = (await response.json()) as AnthropicResponseBody;
    const content = data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("") ?? "";

    if (!content) {
      throw new Error("Anthropic returned an empty response.");
    }

    return {
      content,
      model: data.model ?? model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}
