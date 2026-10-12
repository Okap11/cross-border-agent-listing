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

/**
 * 统一流式生成
 * @param {object} cfg 当前 LLM 配置
 * @param {string} cfg.backend 'ollama' | 'dashscope'
 * @param {string} [cfg.model]
 * @param {string} [cfg.apiKey]    百炼 API Key
 * @param {string} [cfg.baseUrl]   百炼 Base URL
 * @param {string} prompt
 * @param {Function} onChunk
 * @param {Function} onDone
 */
export const streamGenerate = async ({ backend, model, apiKey, baseUrl, prompt, onChunk, onDone }) => {
  if (backend === 'dashscope') {
    return dashscopeStream({
      apiKey,
      baseUrl,
      model,
      messages: [{ role: 'user', content: prompt }],
      onChunk,
      onDone
    })
  }
  return ollamaStream({ model, prompt, onChunk, onDone })
}

/**
 * 获取当前后端可用模型列表
 */
export const listModels = async (cfg) => {
  if (cfg.backend === 'dashscope') {
    return listDashscopeModels({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl })
  }
  return listOllamaModels()
}

/**
 * 后端健康检查
 * @returns {Promise<{ok: boolean, backend: string, online: boolean}>}
 */
export const checkBackend = async (cfg) => {
  if (cfg.backend === 'dashscope') {
    const online = await checkDashscope({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl })
    return { ok: online, backend: 'dashscope', online }
  }
  const online = await checkOllama()
  return { ok: online, backend: 'ollama', online }
}
