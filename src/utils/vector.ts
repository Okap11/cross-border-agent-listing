/**
 * 轻量本地向量检索（Local-First）
 * MVP 采用基于词频(TF) + 余弦相似度的纯浏览器实现，不依赖外部模型，
 * 保证离线可用、数据不出本机。后续可无缝替换为：
 *   - Ollama embedding 接口 + sqlite-vss(wasm) 语义检索
 * 本文件保持统一接口：chunkText / buildIndex / search
 */

import type { ChunkDoc, VectorIndex, ScoredChunk } from '../types/vector'

// 中文/英文/数字分词
const tokenize = (text: string): string[] => {
  const normalized = String(text || '').toLowerCase()
  // 英文单词 + 数字
  const en = normalized.match(/[a-z0-9]+/g) || []
  // 中文字符（按字或二元组切分，这里用二元组增强语义）
  const zh = normalized.match(/[\u4e00-\u9fa5]/g) || []
  const zhBigrams: string[] = []
  for (let i = 0; i < zh.length - 1; i++) {
    zhBigrams.push(zh[i] + zh[i + 1])
  }
  return [...en, ...zhBigrams]
}

/** 文本分片：按句号/换行切分，合并短片段 */
export const chunkText = (text: string, maxLen = 200): string[] => {
  const sentences = String(text || '')
    .split(/[。！？!?\n；;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const chunks: string[] = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur) {
      chunks.push(cur)
      cur = s
    } else {
      cur = cur ? `${cur}。${s}` : s
    }
  }
  if (cur) chunks.push(cur)
  return chunks
}

/**
 * 构建倒排索引
 * @param docs  [{ id, text }]
 */
export const buildIndex = (docs: ChunkDoc[]): VectorIndex => {
  const df = new Map<string, number>() // 词 -> 包含文档数
  const postings = new Map<string, Map<string, number>>() // 词 -> Map<docId, tf>
  const docTokens = new Map<string, Map<string, number>>() // docId -> 词频Map

  for (const doc of docs) {
    const tokens = tokenize(doc.text)
    const tf = new Map<string, number>()
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1)
    }
    docTokens.set(doc.id, tf)
    for (const t of tf.keys()) {
      df.set(t, (df.get(t) || 0) + 1)
      if (!postings.has(t)) postings.set(t, new Map<string, number>())
      postings.get(t)!.set(doc.id, tf.get(t)!)
    }
  }
  return { df, postings, docTokens, docCount: docs.length }
}

/** 余弦相似度（TF-IDF 加权） */
const cosine = (
  queryTf: Map<string, number>,
  docTf: Map<string, number> | undefined,
  df: Map<string, number>,
  docCount: number
): number => {
  const idf = (term: string): number => Math.log(1 + docCount / (1 + (df.get(term) || 0)))
  let dot = 0
  let qNorm = 0
  let dNorm = 0
  for (const [term, qtf] of queryTf) {
    const wq = qtf * idf(term)
    qNorm += wq * wq
    const d = docTf?.get(term)
    if (d) {
      const wd = d * idf(term)
      dot += wq * wd
      dNorm += wd * wd
    }
  }
  if (qNorm === 0 || dNorm === 0) return 0
  return dot / (Math.sqrt(qNorm) * Math.sqrt(dNorm))
}

/**
 * 检索最相关文档片段
 * @param index buildIndex 的结果
 * @param docs 原始文档 [{id, text}]
 * @param query 查询语句
 * @param topK
 */
export const search = (index: VectorIndex, docs: ChunkDoc[], query: string, topK = 5): ScoredChunk[] => {
  const qTf = tokenize(query).reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map<string, number>())
  const scored = docs.map((doc) => {
    const docTf = index.docTokens.get(doc.id)
    const score = cosine(qTf, docTf, index.df, index.docCount)
    return { ...doc, score }
  })
  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
