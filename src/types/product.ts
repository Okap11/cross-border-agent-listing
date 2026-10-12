/**
 * 商品数据模型类型定义
 *
 * 运行时形态（见 utils/db.js 的 saveProduct / saveProducts）：
 *  - 表单对象（ProductEdit.vue）所有字段值均为字符串；
 *  - 从 Excel 导入的单元格可能是数字；
 *  - 入库时由 db.js 补 id（字符串）与 updatedAt（毫秒时间戳）。
 */

/**
 * 商品输入对象：以源字段 key 为键的松散键值对。
 * 带字符串索引签名，使「表单对象 spread 进商品」可通过类型检查。
 */
export interface ProductInput {
  [key: string]: string | number | undefined
}

/** 已持久化的商品对象（db.js 运行时保证 id / updatedAt 已补全） */
export interface Product extends ProductInput {
  /** 商品 id：`${Date.now()}_${随机串}` */
  id: string
  /** 最后更新时间（毫秒时间戳） */
  updatedAt: number
}
