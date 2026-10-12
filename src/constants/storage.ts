/**
 * 本地存储（localforage）的 DB 名与各 store 名
 * 来源：utils/db.js 各 createInstance、stores/settings.js 顶部 settingsInstance
 */

/** 统一数据库名 */
export const DB_NAME = 'cross-border-agent'

/** 商品数据 store */
export const PRODUCTS_STORE = 'products'

/** 竞品评论 store（原始文本 + 分片向量） */
export const COMMENTS_STORE = 'comments'

/** AI 生成历史 store */
export const GENERATIONS_STORE = 'generations'

/** LLM 设置 store */
export const SETTINGS_STORE = 'settings'
