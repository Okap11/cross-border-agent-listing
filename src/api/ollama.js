/**
 * Ollama HTTP API 封装（SSE 流式输出）
 * 前端统一请求 /ollama/*，由 Vite dev server 代理到 http://127.0.0.1:11434，
 * 从而规避浏览器跨域限制。生产部署时需在后端/网关配置同源代理。
 */

const OLLAMA_BASE = '/ollama'

/**
 * 流式生成（对应 POST /api/generate，stream=true）
 * @param {object} options
 * @param {string} options.model 模型名，如 qwen2:7b
 * @param {string} options.prompt 提示词
 * @param {Function} options.onChunk 每段文本回调 (text)
 * @param {Function} options.onDone 结束回调 (fullText)
 * @param {object} [options.extra] 其他参数（temperature 等）
 */
export async function ollamaStream({ model, prompt, onChunk, onDone, extra = {} }) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: true, ...extra })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Ollama 请求失败 (${res.status}): ${errText}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const json = JSON.parse(trimmed)
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
export async function ollamaGenerate({ model, prompt, extra = {} }) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, ...extra })
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Ollama 请求失败 (${res.status}): ${errText}`)
  }
  const json = await res.json()
  return json.response || ''
}

/**
 * 列出本机已安装的模型（用于下拉选择）
 */
export async function listOllamaModels() {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`)
  if (!res.ok) throw new Error(`获取模型列表失败 (${res.status})`)
  const json = await res.json()
  return (json.models || []).map((m) => m.name)
}

/**
 * 健康检查：Ollama 是否已启动
 */
export async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}
