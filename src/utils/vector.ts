/**
 * 轻量本地向量检索（Local-First）
 * MVP 采用基于词频(TF) + 余弦相似度的纯浏览器实现，不依赖外部模型，
 * 保证离线可用、数据不出本机。后续可无缝替换为：
 *   - Ollama embedding 接口 + sqlite-vss(wasm) 语义检索
 * 本文件保持统一接口：chunkText / buildIndex / search
 */

import type { ChunkDoc, VectorIndex, ScoredChunk, ContextSelection } from '../types/vector'

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

/**
 * 中文 -> 英文领域词扩展表
 * 评论素材基本是英文原文（Shein / Amazon 等），而用户习惯用中文提问；
 * 纯词频检索是「字面匹配」，中文二元组与英文单词没有交集，命中数会直接为 0。
 * 这里用一张小型词表把中文问题扩展到对应英文词，保证离线可用、无需 embedding 服务。
 */
const zhEnGlossary: Array<[string, string[]]> = [
  ['质量', ['quality']],
  ['品质', ['quality']],
  ['做工', ['quality', 'stitching']],
  ['面料', ['fabric', 'material']],
  ['材质', ['material', 'fabric']],
  ['手感', ['soft', 'touch']],
  ['柔软', ['soft']],
  ['舒服', ['comfortable', 'comfy']],
  ['舒适', ['comfortable', 'comfy']],
  ['尺码', ['size', 'fit']],
  ['尺寸', ['size']],
  ['偏大', ['runs large', 'big']],
  ['偏小', ['runs small', 'tight']],
  ['合身', ['true to size', 'fit']],
  ['版型', ['fit', 'cut']],
  ['颜色', ['color']],
  ['色差', ['color', 'different']],
  ['掉色', ['fade', 'color']],
  ['起球', ['pilling', 'ball']],
  ['缩水', ['shrink']],
  ['透', ['see through', 'sheer']],
  ['线头', ['thread', 'loose']],
  ['开线', ['seam', 'ripped']],
  ['拉链', ['zipper', 'zip']],
  ['设计', ['design']],
  ['款式', ['style', 'design']],
  ['图案', ['print', 'pattern']],
  ['物流', ['shipping', 'delivery']],
  ['发货', ['shipping', 'delivery']],
  ['快递', ['shipping', 'delivery']],
  ['包装', ['packaging']],
  ['客服', ['customer service']],
  ['退货', ['return']],
  ['退款', ['refund']],
  ['价格', ['price', 'cheap']],
  ['性价比', ['value', 'price']],
  ['便宜', ['cheap']],
  ['差评', ['complaint', 'disappointed', 'bad']],
  ['好评', ['love', 'great', 'cute']],
  ['满意', ['happy', 'satisfied']],
  ['推荐', ['recommend']],
  ['喜欢', ['love', 'like']],
  ['可爱', ['cute']],
  ['漂亮', ['pretty', 'beautiful']],
  ['百搭', ['versatile', 'outfit']],
  ['显瘦', ['slim', 'flattering']],
  ['卖点', ['selling point', 'feature']],
  ['缺点', ['flaw', 'complaint']],
  ['改进', ['improve']]
]

/** 中文提问时补充英文同义词，让中文问题也能命中英文评论 */
export const expandQuery = (query: string): string => {
  const q = String(query || '')
  if (!/[\u4e00-\u9fa5]/.test(q)) return q
  const extra: string[] = []
  for (const [zh, ens] of zhEnGlossary) {
    if (q.includes(zh)) extra.push(...ens)
  }
  return extra.length ? `${q} ${extra.join(' ')}` : q
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
  const qTf = tokenize(expandQuery(query)).reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map<string, number>())
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

/** 按字符预算在全集上均匀抽样，避免超长上下文爆掉模型窗口 */
const sampleEvenly = (docs: ChunkDoc[], maxChars: number): ScoredChunk[] => {
  const totalChars = docs.reduce((n, d) => n + d.text.length, 0)
  const avg = totalChars / Math.max(1, docs.length)
  const capacity = Math.max(1, Math.floor(maxChars / Math.max(1, avg)))
  const step = Math.max(1, Math.floor(docs.length / capacity))
  const picked: ScoredChunk[] = []
  let used = 0
  for (let i = 0; i < docs.length; i += step) {
    const doc = docs[i]
    if (picked.length && used + doc.text.length > maxChars) break
    picked.push({ ...doc, score: 0 })
    used += doc.text.length
  }
  return picked
}

/**
 * 挑选送入 prompt 的评论片段，保证「只要有评论就一定有上下文」：
 *  1. 语料总量在字符预算内 -> 直接给全文（小语料没必要做召回，避免召回漏掉关键评价）
 *  2. 否则先走关键词检索
 *  3. 关键词一条都没命中（典型场景：中文提问 + 英文评论）-> 均匀抽样覆盖整个评论集
 * 返回的 note 会带进 prompt，让模型知道这批片段是怎么来的。
 * maxChars 默认 8000 字符（约 4~5k token），常见的几百条短评论可以直接全文送入。
 */
export const selectContext = (
  index: VectorIndex,
  docs: ChunkDoc[],
  query: string,
  { topK = 8, maxChars = 8000 }: { topK?: number; maxChars?: number } = {}
): ContextSelection => {
  if (!docs.length) return { chunks: [], note: '' }
  const totalChars = docs.reduce((n, d) => n + d.text.length, 0)
  if (totalChars <= maxChars) {
    return {
      chunks: docs.map((d) => ({ ...d, score: 0 })),
      note: `已提供全部 ${docs.length} 条评论原文`
    }
  }
  const hits = search(index, docs, query, topK)
  if (hits.length) {
    const picked: ScoredChunk[] = []
    let used = 0
    for (const h of hits) {
      if (picked.length && used + h.text.length > maxChars) break
      picked.push(h)
      used += h.text.length
    }
    return {
      chunks: picked,
      note: `关键词检索命中 ${picked.length} 条最相关评论（评论共 ${docs.length} 条）`
    }
  }
  const picked = sampleEvenly(docs, maxChars)
  return {
    chunks: picked,
    note: `关键词未命中，以下为从 ${docs.length} 条评论中均匀抽样的 ${picked.length} 条`
  }
}
