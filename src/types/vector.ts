/**
 * 本地向量检索（utils/vector.js）的数据形态类型
 */

/** 分片文档（chunkText 的产物 / buildIndex 的输入） */
export interface ChunkDoc {
  id: string
  text: string
}

/**
 * buildIndex 的倒排索引结果
 * - df:       词 -> 包含文档数
 * - postings: 词 -> Map<docId, 词频>
 * - docTokens: docId -> Map<词, 词频>
 */
export interface VectorIndex {
  df: Map<string, number>
  postings: Map<string, Map<string, number>>
  docTokens: Map<string, Map<string, number>>
  docCount: number
}

/** search 的命中结果（分片文档 + 相似度得分） */
export interface ScoredChunk extends ChunkDoc {
  score: number
}
