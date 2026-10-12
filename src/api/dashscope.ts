/**
 * 阿里云百炼（DashScope）OpenAI 兼容接口封装
 *
 * 参考官方文档：
 *  - Base URL（北京）：https://dashscope.aliyuncs.com/compatible-mode/v1
 *  - 认证：Authorization: Bearer <API_KEY>
 *  - 流式：POST /compatible-mode/v1/chat/completions  body: { model, messages, stream: true }
 *  - 响应：SSE，choices[0].delta.content
 *
 * 开发环境下，当 baseUrl 为默认的 dashscope.aliyuncs.com 时，
 * 请求会走 Vite 代理路径 /dashscope，从而规避浏览器跨域限制。
 */

import { DEFAULT_DASHSCOPE_BASE_URL } from '../constants/llm'
import type { ChatMessage } from '../types/llm'

/** 流式生成入参 */
interface DashscopeStreamParams {
  apiKey: string
  baseUrl?: string
  model: string
  messages: ChatMessage[]
  onChunk?: (text: string) => void
  onDone?: (fullText: string) => void
}

/** 非流式生成入参 */
interface DashscopeGenerateParams {
  apiKey: string
  baseUrl?: string
  model: string
  messages: ChatMessage[]
  extra?: Record<string, unknown>
}

/** 模型列表 / 健康检查入参 */
interface DashscopeListParams {
  apiKey: string
  baseUrl?: string
}

const normalizeBase = (baseUrl?: string): string => {
  return (baseUrl || DEFAULT_DASHSCOPE_BASE_URL).replace(/\/+$/, '')
}

/**
 * 解析请求地址：
 *  - 默认域名（dashscope.aliyuncs.com）=> 走 /dashscope 代理（dev 无 CORS）
 *  - 自定义域名（如不同地域 / 网关）=> 直连
 */
const resolveEndpoint = (baseUrl: string | undefined, path: string): string => {
  const base = normalizeBase(baseUrl)
  if (base.includes('dashscope.aliyuncs.com')) {
    return `/dashscope${path}`
  }
  return `${base}${path}`
}

const authHeaders = (apiKey: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  }
}

/**
 * 流式生成（OpenAI 兼容 chat/completions，stream: true）
 */
export const dashscopeStream = async ({ apiKey, baseUrl, model, messages, onChunk, onDone }: DashscopeStreamParams): Promise<void> => {
  if (!apiKey) throw new Error('未配置阿里百炼 API Key')
  if (!model) throw new Error('未指定百炼模型')
  const res = await fetch(resolveEndpoint(baseUrl, '/compatible-mode/v1/chat/completions'), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ model, messages, stream: true })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`百炼请求失败 (${res.status}): ${errText.slice(0, 200)}`)
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
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') {
        onDone?.(fullText)
        continue
      }
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> }
        const content = json.choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          onChunk?.(content)
        }
      } catch {
        // 忽略无法解析的行
      }
    }
  }
  onDone?.(fullText)
}

/**
 * 非流式生成
 */
export const dashscopeGenerate = async ({ apiKey, baseUrl, model, messages, extra = {} }: DashscopeGenerateParams): Promise<string> => {
  if (!apiKey) throw new Error('未配置阿里百炼 API Key')
  const res = await fetch(resolveEndpoint(baseUrl, '/compatible-mode/v1/chat/completions'), {
    method: 'POST',
    headers: authHeaders(apiKey),
    body: JSON.stringify({ model, messages, ...extra })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`百炼请求失败 (${res.status}): ${errText.slice(0, 200)}`)
  }
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content || ''
}

/**
 * 获取百炼可用模型列表
 * GET /compatible-mode/v1/models
 */
export const listDashscopeModels = async ({ apiKey, baseUrl }: DashscopeListParams): Promise<string[]> => {
  const res = await fetch(resolveEndpoint(baseUrl, '/compatible-mode/v1/models'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`获取百炼模型失败 (${res.status})`)
  const json = await res.json() as { data?: Array<{ id?: string }> }
  return (json.data || []).map((m) => m.id).filter(Boolean) as string[]
}

/**
 * 健康检查：API Key 与 Base URL 是否可用
 */
export const checkDashscope = async ({ apiKey, baseUrl }: DashscopeListParams): Promise<boolean> => {
  try {
    await listDashscopeModels({ apiKey, baseUrl })
    return true
  } catch {
    return false
  }
}
