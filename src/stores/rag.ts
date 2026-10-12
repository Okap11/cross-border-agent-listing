import { defineStore } from 'pinia'
import { getAllComments, saveComments, clearComments } from '../utils/db'
import { chunkText, buildIndex, search } from '../utils/vector'
import { getRagPrompt } from '../utils/prompt'
import { streamGenerate } from '../api/llm'
import type { CommentRecord } from '../types/storage'
import type { StreamGenerateParams } from '../types/llm'

/** 分片后的文档片段 */
interface RagChunk {
  id: string
  text: string
}

/** 倒排索引的形态跟随 utils/vector 的 buildIndex 返回值 */
type RagIndex = ReturnType<typeof buildIndex>

export const useRagStore = defineStore('rag', {
  state: (): {
    comments: CommentRecord[] // 原始评论
    chunks: RagChunk[] // 分片后的文档 [{id, text}]
    index: RagIndex | null // 倒排索引
    indexedCount: number
    answer: string
    answering: boolean
    error: string | null
  } => ({
    comments: [],
    chunks: [],
    index: null,
    indexedCount: 0,
    answer: '',
    answering: false,
    error: null
  }),
  actions: {
    /** 导入评论文本并入库、分片、建索引 */
    async importComments(rawText: string): Promise<number> {
      this.error = null
      // 按行拆分评论
      const lines = String(rawText || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      const items = lines.map((text) => ({ text }))
      if (!items.length) {
        this.error = '未解析到任何评论内容'
        return 0
      }
      await saveComments(items)
      await this.rebuild()
      return items.length
    },

    /** 从本地库重建分片与索引 */
    async rebuild() {
      this.comments = (await getAllComments()) as CommentRecord[]
      this.chunks = []
      let seq = 0
      for (const c of this.comments) {
        for (const text of chunkText(c.text)) {
          this.chunks.push({ id: `chunk_${seq++}`, text })
        }
      }
      this.index = buildIndex(this.chunks)
      this.indexedCount = this.chunks.length
    },

    async clearAll() {
      await clearComments()
      this.comments = []
      this.chunks = []
      this.index = null
      this.indexedCount = 0
    },

    /**
     * 执行 RAG 问答：召回相关片段 -> 构造 prompt -> 统一后端流式生成
     */
    async ask(
      question: string,
      { cfg, onChunk }: { cfg: StreamGenerateParams; onChunk?: (text: string) => void }
    ) {
      if (!this.index || !this.chunks.length) {
        this.error = '请先导入竞品评论并建立索引'
        return
      }
      if (!question.trim()) {
        this.error = '请输入问题'
        return
      }
      this.answer = ''
      this.answering = true
      this.error = null
      try {
        const hits = search(this.index, this.chunks, question, 5)
        const context = hits
          .map((h, i) => `[片段${i + 1}] ${h.text}`)
          .join('\n---\n')
        const prompt = getRagPrompt(question, context)
        await streamGenerate({
          ...cfg,
          prompt,
          onChunk: (t) => {
            this.answer += t
            onChunk?.(t)
          },
          onDone: () => {}
        })
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
      } finally {
        this.answering = false
      }
    }
  }
})
