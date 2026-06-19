// LLM 抽象层类型定义
// 定义了 LLM 提供商的统一接口，支持多提供商（OpenAI、Anthropic 等）的切换

/**
 * LLM 聊天消息格式
 */
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * LLM 调用配置
 */
export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * LLM 响应格式
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM 提供商接口
 * 所有 LLM 提供商（OpenAI、Anthropic 等）必须实现此接口
 */
export interface LLMProvider {
  /** 提供商名称 */
  name: string;
  /** 发送聊天消息并返回响应 */
  chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
  /** 检查提供商是否已正确配置（API Key 等） */
  isConfigured(): boolean;
}
