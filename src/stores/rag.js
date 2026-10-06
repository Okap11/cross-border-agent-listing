import { defineStore } from 'pinia'
import { getAllComments, saveComments, clearComments } from '../utils/db'
import { chunkText, buildIndex, search } from '../utils/vector'
import { getRagPrompt } from '../utils/prompt'
import { ollamaStream } from '../api/ollama'

export const useRagStore = defineStore('rag', {
  state: () => ({
    comments: [], // 原始评论
    chunks: [], // 分片后的文档 [{id, text}]
    index: null, // 倒排索引
    indexedCount: 0,
    answer: '',
    answering: false,
    error: null
  }),
  actions: {
    /** 导入评论文本并入库、分片、建索引 */
    async importComments(rawText) {
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
      this.comments = await getAllComments()
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
     * 执行 RAG 问答：召回相关片段 -> 构造 prompt -> Ollama 流式生成
     */
    async ask(question, { model, onChunk }) {
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
        await ollamaStream({
          model,
          prompt,
          onChunk: (t) => {
            this.answer += t
            onChunk?.(t)
          },
          onDone: () => {}
        })
      } catch (e) {
        this.error = e.message
      } finally {
        this.answering = false
      }
    }
  }
})
