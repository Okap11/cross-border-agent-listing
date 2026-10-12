/**
 * 统一 LLM 后端适配层
 * 根据 settings 中的 backend 配置，将请求路由到对应后端实现：
 *  - 'ollama'    本地大模型（SSE）
 *  - 'dashscope' 阿里云百炼（OpenAI 兼容接口）
 *
 * 调用方（页面 / store）只依赖本模块，不关心具体后端，便于扩展。
 */

import { ollamaStream, listOllamaModels, checkOllama } from './ollama'
import { dashscopeStream, listDashscopeModels, checkDashscope } from './dashscope'
import type { StreamGenerateParams, ModelList, CheckBackendResult, LLMBackend } from '../types/llm'

/** listModels / checkBackend 共用的最小配置入参 */
interface BackendCfg {
  backend: LLMBackend
  apiKey?: string
  baseUrl?: string
  model?: string
}

/**
 * 统一流式生成
 */
export const streamGenerate = async ({ backend, model, apiKey, baseUrl, prompt, onChunk, onDone }: StreamGenerateParams): Promise<void> => {
  if (backend === 'dashscope') {
    return dashscopeStream({
      apiKey: apiKey || '',
      baseUrl,
      model: model || '',
      messages: [{ role: 'user', content: prompt }],
      onChunk,
      onDone
    })
  }
  return ollamaStream({ model: model || '', prompt, onChunk, onDone })
}

/**
 * 获取当前后端可用模型列表
 */
export const listModels = async (cfg: BackendCfg): Promise<ModelList> => {
  if (cfg.backend === 'dashscope') {
    return listDashscopeModels({ apiKey: cfg.apiKey || '', baseUrl: cfg.baseUrl })
  }
  return listOllamaModels()
}

/**
 * 后端健康检查
 */
export const checkBackend = async (cfg: BackendCfg): Promise<CheckBackendResult> => {
  if (cfg.backend === 'dashscope') {
    const online = await checkDashscope({ apiKey: cfg.apiKey || '', baseUrl: cfg.baseUrl })
    return { ok: online, backend: 'dashscope', online }
  }
  const online = await checkOllama()
  return { ok: online, backend: 'ollama', online }
}
