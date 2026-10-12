/**
 * LLM 后端（Ollama / 阿里百炼）统一适配层的类型定义
 * 默认配置见 constants/llm.ts
 */

/** LLM 后端标识 */
export type LLMBackend = 'ollama' | 'dashscope'

/** 百炼子配置 */
export interface DashscopeConfig {
  /** 阿里百炼 API Key */
  apiKey: string
  /** 模型名，如 qwen-plus */
  model: string
  /** 接入 Base URL，默认北京地域 */
  baseUrl: string
}

/** settings store 中持久化的 LLM 配置整体形态 */
export interface LLMSettings {
  backend: LLMBackend
  /** 本地 Ollama 模型名 */
  ollamaModel: string
  dashscope: DashscopeConfig
}

/** chat/completions 消息 */
export interface ChatMessage {
  role: string
  content: string
}

/**
 * streamGenerate 的入参（api/llm.js）
 * - backend = 'dashscope' 时使用 apiKey / baseUrl / model
 * - backend = 'ollama' 时使用 model（对应 ollamaModel）
 */
export interface StreamGenerateParams {
  backend: LLMBackend
  /** 模型名（可选：缺省时由调用方/后端默认） */
  model?: string
  /** 百炼 API Key（仅 dashscope） */
  apiKey?: string
  /** 百炼 Base URL（仅 dashscope） */
  baseUrl?: string
  /** 提示词 */
  prompt: string
  /** 流式分片回调 */
  onChunk?: (text: string) => void
  /** 结束回调（fullText 为完整生成文本） */
  onDone?: (fullText: string) => void
}

/** listModels 返回的模型列表项（模型名字符串） */
export type ModelList = string[]

/** checkBackend 返回值 */
export interface CheckBackendResult {
  ok: boolean
  backend: LLMBackend
  online: boolean
}
