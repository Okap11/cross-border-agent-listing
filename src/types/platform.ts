/**
 * 目标上架平台的类型定义
 * 数据本体见 constants/platforms.ts
 */

/** 目标平台标识 */
export type PlatformKey = 'ozon' | 'shein'

/** 单个平台字段的映射元信息 */
export interface PlatformFieldMeta {
  /** 平台侧展示名（导出模板的列头） */
  label: string
  /** 平台侧是否必填 */
  required: boolean
}

/**
 * 平台字段表：按平台分键，内层为「源字段 key -> 平台元信息」
 */
export type PlatformSchema = Record<PlatformKey, Record<string, PlatformFieldMeta>>
