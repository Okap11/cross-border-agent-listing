/**
 * 各平台字段定义：key（源字段）-> { label, required }
 * label 尽量对齐该平台官方字段名 / 后台展示名。
 */

import type { PlatformSchema } from '../types/platform'

export const platformSchema: PlatformSchema = {
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
