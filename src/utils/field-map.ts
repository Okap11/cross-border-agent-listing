/**
 * 源商品数据 → 目标平台上架模板的映射（纯函数）
 *
 * 业务数据已迁出本文件：
 *  - sourceFields / fieldGroups  → constants/fields.ts
 *  - platformSchema              → constants/platforms.ts
 * 视图层请直接从 constants/ 引用上述常量，本模块只保留映射逻辑。
 */

import { platformSchema } from '../constants/platforms'
import type { PlatformKey } from '../types/platform'
import type { ProductInput } from '../types/product'

/**
 * 源商品数据映射到目标平台字段（导出为平台模板的扁平对象）
 * @param sourceData 统一源商品数据
 * @param platform   'ozon' | 'shein'
 * @returns 以平台字段 label 为 key 的对象
 */
export const mapToPlatform = (
  sourceData: ProductInput,
  platform: PlatformKey
): Record<string, string> => {
  const schema = platformSchema[platform]
  const result: Record<string, string> = {}
  Object.entries(schema).forEach(([key, meta]) => {
    result[meta.label] = String(sourceData[key] ?? '')
  })
  return result
}

/**
 * 生成平台 CSV 的表头行
 */
export const getPlatformHeaders = (platform: PlatformKey): string[] => {
  const schema = platformSchema[platform]
  return Object.keys(schema).map((key) => schema[key].label)
}
