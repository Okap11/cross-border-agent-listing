/**
 * Ozon / SHEIN 平台上架字段模型（基于官方资料调研整理）
 *
 * 字段依据来源：
 *  - Ozon Seller API 商品上传（POST /v2/product/import）与卖家后台商品卡片
 *    https://docs.ozon.com/global/en/api/via-api/
 *  - SHEIN 开放平台商品发布接口（/open-api/goods/publish，SPU/SKC/SKU 三层）与商品发布字段规范
 *    https://open.sheincorp.cn/zh/documents/apidoc/detail/3001898
 *
 * 结构：统一「源商品数据」→ 通过映射导出为各平台上架模板。
 */

import type { SourceField } from '../types/field'

// 统一源商品字段（录入表单据此渲染，按业务分组）
export const sourceFields: SourceField[] = [
  // ── 基础信息 ──
  { key: 'sku', label: '货号 / SKU 编码', group: '基础信息', type: 'text', required: true },
  { key: 'name', label: '商品标题', group: '基础信息', type: 'text', required: true },
  { key: 'description', label: '商品描述', group: '基础信息', type: 'textarea', required: true },
  { key: 'category', label: '类目', group: '基础信息', type: 'text', required: true },
  { key: 'brand', label: '品牌', group: '基础信息', type: 'text', required: false },
  { key: 'model', label: '型号 / 系列', group: '基础信息', type: 'text', required: false },

  // ── 价格 ──
  { key: 'price', label: '售价', group: '价格', type: 'number', required: true },
  { key: 'old_price', label: '划线价 / 原价', group: '价格', type: 'number', required: false },
  { key: 'cost', label: '供货价 / 成本', group: '价格', type: 'number', required: false },
  { key: 'currency', label: '币种', group: '价格', type: 'text', required: false },
  { key: 'vat', label: '增值税率（如 0 / 0.2）', group: '价格', type: 'text', required: false },

  // ── 物流与包装 ──
  { key: 'weight', label: '包装重量（克）', group: '物流与包装', type: 'number', required: true },
  { key: 'length', label: '包装长（mm）', group: '物流与包装', type: 'number', required: true },
  { key: 'width', label: '包装宽（mm）', group: '物流与包装', type: 'number', required: true },
  { key: 'height', label: '包装高（mm）', group: '物流与包装', type: 'number', required: true },
  { key: 'package_type', label: '包装类型', group: '物流与包装', type: 'text', required: false },

  // ── 视觉 ──
  { key: 'images', label: '图片（逗号分隔 URL）', group: '视觉', type: 'textarea', required: true },
  { key: 'video', label: '商品视频 URL', group: '视觉', type: 'text', required: false },

  // ── 变体与属性 ──
  { key: 'color', label: '颜色（变体）', group: '变体与属性', type: 'text', required: false },
  { key: 'size', label: '尺码（变体）', group: '变体与属性', type: 'text', required: false },
  { key: 'material', label: '材质', group: '变体与属性', type: 'text', required: false },
  { key: 'attributes', label: '类目特性（JSON）', group: '变体与属性', type: 'textarea', required: false },

  // ── 库存与合规 ──
  { key: 'stock', label: '库存数量', group: '库存与合规', type: 'number', required: false },
  { key: 'minimum_stock', label: '最小备货数量', group: '库存与合规', type: 'number', required: false },
  { key: 'barcode', label: '商家条码 / EAN', group: '库存与合规', type: 'text', required: false },
  { key: 'hs_code', label: '商品海关编码', group: '库存与合规', type: 'text', required: false }
]

// 字段业务分组顺序（用于表单分区展示）
export const fieldGroups: string[] = ['基础信息', '价格', '物流与包装', '视觉', '变体与属性', '库存与合规']
