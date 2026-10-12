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

// 统一源商品字段（录入表单据此渲染，按业务分组）
export const sourceFields = [
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
export const fieldGroups = ['基础信息', '价格', '物流与包装', '视觉', '变体与属性', '库存与合规']

/**
 * 各平台字段定义：key（源字段）-> { label, required }
 * label 尽量对齐该平台官方字段名 / 后台展示名。
 */
export const platformSchema = {
  // Ozon：offer_id / name / vendor / category_id / price / vat / 包装重量与尺寸 / attributes / 变体
  ozon: {
    sku: { label: '货号 (offer_id)', required: true },
    name: { label: '商品名称 (name)', required: true },
    brand: { label: '品牌 (vendor)', required: true },
    model: { label: '型号', required: false },
    description: { label: '商品描述 (description)', required: true },
    category: { label: '类目 (category_id)', required: true },
    price: { label: '价格 (price)', required: true },
    old_price: { label: '划线价 (old_price)', required: false },
    vat: { label: '增值税 (vat)', required: true },
    weight: { label: '包装重量 克', required: true },
    length: { label: '包装长 mm', required: true },
    width: { label: '包装宽 mm', required: true },
    height: { label: '包装高 mm', required: true },
    images: { label: '图片 (images)', required: true },
    color: { label: '变体-颜色', required: false },
    size: { label: '变体-尺码', required: false },
    attributes: { label: '类目特性 (attributes)', required: false },
    hs_code: { label: '商品海关编码', required: false }
  },

  // SHEIN：supplier_code / 标题 / brand_code / category_id / 颜色(SKC) / 尺码(SKU) / 供货价 / 图片 / 尺码表等
  shein: {
    sku: { label: '货号 (supplier_code)', required: true },
    name: { label: '商品标题（默认语种）', required: true },
    brand: { label: '品牌 (brand_code)', required: false },
    description: { label: '商品描述', required: false },
    category: { label: '末级类目 (category_id)', required: true },
    color: { label: '主销售属性-颜色 (SKC)', required: true },
    size: { label: '次销售属性-尺码 (SKU)', required: false },
    cost: { label: '供货价 (cost_info.price)', required: true },
    price: { label: '建议零售价', required: false },
    currency: { label: '币种 (currency)', required: false },
    minimum_stock: { label: '最小备货数量', required: false },
    stock: { label: '备货数量', required: false },
    images: { label: '图片', required: true },
    material: { label: '材质', required: false },
    barcode: { label: '商家条码', required: false },
    package_type: { label: '包装类型', required: false },
    video: { label: '商品视频', required: false },
    attributes: { label: '商品属性', required: false }
  }
}

/**
 * 源商品数据映射到目标平台字段（导出为平台模板的扁平对象）
 * @param {object} sourceData 统一源商品数据
 * @param {string} platform  'ozon' | 'shein'
 * @returns {object} 以平台字段 label 为 key 的对象
 */
export const mapToPlatform = (sourceData, platform) => {
  const schema = platformSchema[platform]
  const result = {}
  Object.entries(schema).forEach(([key, meta]) => {
    result[meta.label] = sourceData[key] ?? ''
  })
  return result
}

/**
 * 生成平台 CSV 的表头行
 */
export const getPlatformHeaders = (platform) => {
  const schema = platformSchema[platform]
  return Object.keys(schema).map((key) => schema[key].label)
}
