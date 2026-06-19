// LLM 提供商工厂函数
// 根据 LLM_PROVIDER 环境变量选择并返回对应的 LLM 提供商实例
// 支持的提供商: openai (默认), anthropic

import type { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";

/**
 * 获取当前配置的 LLM 提供商实例
 * 通过 LLM_PROVIDER 环境变量控制选择哪个提供商
 * 默认使用 OpenAI
 */
export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider();
    case "openai":
    default:
      return new OpenAIProvider();
  }
}
