/**
 * 本地存储（localforage / IndexedDB）各 store 的记录类型
 * store 名见 constants/storage.ts
 */

import type { LLMSettings } from './llm'

/** 竞品评论入库记录（saveComments 运行时补 id / updatedAt） */
export interface CommentRecord {
  id: string
  /** 评论文本原文 */
  text: string
  updatedAt: number
}

/** 提交给 saveComments 的评论输入（仅文本，id/updatedAt 由 db.js 补） */
export type CommentInput = Pick<CommentRecord, 'text'>

/** AI 生成历史记录（saveGeneration；当前尚无调用方，形态保持松散） */
export interface GenerationRecord {
  id?: string
  [key: string]: unknown
}

/** settings store 中持久化的键 'llm' 对应的记录形态 */
export type SettingsRecord = LLMSettings
