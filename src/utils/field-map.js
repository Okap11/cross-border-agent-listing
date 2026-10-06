/**
 * Ozon / Shein Choice 平台字段 Schema 定义与映射工具
 * 统一的「源商品数据」通过映射规则转换为各平台的上架字段
 */

// 统一源商品数据结构
export const sourceFields = [
  { key: 'sku', label: 'SKU 编码', type: 'text' },
  { key: 'title', label: '商品标题', type: 'text' },
  { key: 'description', label: '商品描述', type: 'textarea' },
  { key: 'category', label: '类目', type: 'text' },
  { key: 'attributes', label: '属性（JSON）', type: 'textarea' },
  { key: 'price', label: '售价', type: 'number' },
  { key: 'cost', label: '成本', type: 'number' },
  { key: 'stock', label: '库存', type: 'number' },
  { key: 'images', label: '图片（逗号分隔URL）', type: 'text' }
]

// 各平台字段定义：key -> { label, required }
export const platformSchema = {
  ozon: {
    sku: { label: 'SKU编码', required: true },
    title: { label: '商品标题', required: true },
    description: { label: '产品描述', required: true },
    category: { label: '类目', required: true },
    attributes: { label: '属性', required: false },
    price: { label: '售价', required: true },
    stock: { label: '库存', required: false }
  },
  shein: {
    sku: { label: '商品编码', required: true },
    title: { label: '产品名称', required: true },
    description: { label: '详情描述', required: true },
    category: { label: '产品类目', required: true },
    attributes: { label: '产品参数', required: false },
    price: { label: '售卖价格', required: true },
    stock: { label: '库存', required: false }
  }
}

/**
 * 源商品数据映射到目标平台字段（导出为平台模板的扁平对象）
 * @param {object} sourceData 统一源商品数据
 * @param {string} platform  'ozon' | 'shein'
 * @returns {object} 以平台字段 label 为 key 的对象
 */
export function mapToPlatform(sourceData, platform) {
  const schema = platformSchema[platform]
  const result = {}
  Object.entries(schema).forEach(([key, meta]) => {
    result[meta.label] = sourceData[key] ?? ''
  })
  return result
}

/**
 * 生成平台 CSV 的表头行
 * @param {string} platform
 * @returns {string[]}
 */
export function getPlatformHeaders(platform) {
  const schema = platformSchema[platform]
  return Object.keys(schema).map((key) => schema[key].label)
}
