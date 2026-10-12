/**
 * LLM 后端相关默认配置
 * 来源：stores/settings.js（state.llm）、api/dashscope.js（DEFAULT_BASE_URL）、api/ollama.js（OLLAMA_BASE）
 */

import type { LLMSettings } from '../types/llm'

/** settings store 的 LLM 初始默认值 */
export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  backend: 'dashscope',
  ollamaModel: '',
  dashscope: {
    apiKey: '',
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com'
  }
}

/** 百炼默认 Base URL（北京地域） */
export const DEFAULT_DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com'

/** Ollama 前端统一请求前缀（由 Vite dev server 代理到本机 11434） */
export const OLLAMA_BASE_PATH = '/ollama'
