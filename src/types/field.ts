/**
 * 统一源商品字段模型的类型定义
 * 数据本体见 constants/fields.ts
 */

/** 表单项渲染控件类型 */
export type FieldType = 'text' | 'textarea' | 'number'

/** 单个源字段定义 */
export interface SourceField {
  /** 字段 key（同时作为商品数据对象的键） */
  key: string
  /** 字段展示名（中文） */
  label: string
  /** 业务分组名 */
  group: string
  /** 控件类型 */
  type: FieldType
  /** 是否必填 */
  required: boolean
}

/** 字段业务分组名（与 sourceFields[].group 对应） */
export type FieldGroup = string
