/**
 * Ollama HTTP API 封装（SSE 流式输出）
 * 前端统一请求 /ollama/*，由 Vite dev server 代理到 http://127.0.0.1:11434，
 * 从而规避浏览器跨域限制。生产部署时需在后端/网关配置同源代理。
 */

import { OLLAMA_BASE_PATH } from '../constants/llm'

/** 流式生成入参 */
interface OllamaStreamParams {
  model: string
  prompt: string
  onChunk?: (text: string) => void
  onDone?: (fullText: string) => void
  extra?: Record<string, unknown>
}

/** 非流式生成入参 */
interface OllamaGenerateParams {
  model: string
  prompt: string
  extra?: Record<string, unknown>
}

/**
 * 流式生成（对应 POST /api/generate，stream=true）
 */
export const ollamaStream = async ({ model, prompt, onChunk, onDone, extra = {} }: OllamaStreamParams): Promise<void> => {
  const res = await fetch(`${OLLAMA_BASE_PATH}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: true, ...extra })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Ollama 请求失败 (${res.status}): ${errText}`)
  }
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()!
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const json = JSON.parse(trimmed) as { response?: string; done?: boolean }
        if (json.response) {
          fullText += json.response
          onChunk?.(json.response)
        }
        if (json.done) {
          onDone?.(fullText)
        }
      } catch {
        // 忽略非 JSON 行
      }
    }
  }
  onDone?.(fullText)
}

/**
 * 非流式生成（一次返回完整结果）
 */
export const ollamaGenerate = async ({ model, prompt, extra = {} }: OllamaGenerateParams): Promise<string> => {
  const res = await fetch(`${OLLAMA_BASE_PATH}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, ...extra })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Ollama 请求失败 (${res.status}): ${errText}`)
  }
  const json = await res.json() as { response?: string }
  return json.response || ''
}

/**
 * 列出本机已安装的模型（用于下拉选择）
 */
export const listOllamaModels = async (): Promise<string[]> => {
  const res = await fetch(`${OLLAMA_BASE_PATH}/api/tags`)
  if (!res.ok) throw new Error(`获取模型列表失败 (${res.status})`)
  const json = await res.json() as { models?: Array<{ name?: string }> }
  return (json.models || []).map((m) => m.name) as string[]
}

/**
 * 健康检查：Ollama 是否已启动
 */
export const checkOllama = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${OLLAMA_BASE_PATH}/api/tags`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}
