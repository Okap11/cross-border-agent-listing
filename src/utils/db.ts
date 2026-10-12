import localforage from 'localforage'
import { DB_NAME, PRODUCTS_STORE, COMMENTS_STORE, GENERATIONS_STORE } from '../constants/storage'
import type { Product, ProductInput } from '../types/product'
import type { CommentRecord, CommentInput, GenerationRecord } from '../types/storage'

// 商品数据存储
// 注：localforage 的 createInstance 类型不接受泛型参数，在 iterate/getItem 处做窄化断言
export const productStore = localforage.createInstance({
  name: DB_NAME,
  storeName: PRODUCTS_STORE
})

// 竞品评论存储（原始文本 + 分片向量）
export const commentStore = localforage.createInstance({
  name: DB_NAME,
  storeName: COMMENTS_STORE
})

// AI 生成历史
export const generationStore = localforage.createInstance({
  name: DB_NAME,
  storeName: GENERATIONS_STORE
})

/** 商品 CRUD */
export const getAllProducts = async (): Promise<Product[]> => {
  const list: Product[] = []
  await productStore.iterate((value) => {
    list.push(value as Product)
  })
  return list
}

export const getProduct = async (id: string): Promise<Product | null> => {
  return productStore.getItem(String(id)) as Promise<Product | null>
}

export const saveProduct = async (product: ProductInput): Promise<Product> => {
  if (!product.id) {
    product.id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  product.updatedAt = Date.now()
  const saved = product as Product
  await productStore.setItem(String(saved.id), saved)
  return saved
}

/** 批量保存商品（一次写入多条，避免逐条触发读库） */
export const saveProducts = async (items: ProductInput[]): Promise<Product[]> => {
  const now = Date.now()
  const saved: Product[] = []
  for (const item of items) {
    const p = { ...item } as ProductInput
    if (!p.id) p.id = `${now}_${Math.random().toString(36).slice(2, 8)}`
    p.updatedAt = now
    const savedItem = p as Product
    await productStore.setItem(String(savedItem.id), savedItem)
    saved.push(savedItem)
  }
  return saved
}

export const deleteProduct = async (id: string): Promise<void> => {
  await productStore.removeItem(String(id))
}

/** 评论（竞品）CRUD */
export const getAllComments = async (): Promise<CommentRecord[]> => {
  const list: CommentRecord[] = []
  await commentStore.iterate((value) => {
    list.push(value as CommentRecord)
  })
  return list
}

export const saveComments = async (items: CommentInput[]): Promise<CommentRecord[]> => {
  const now = Date.now()
  for (const item of items) {
    const record = item as CommentRecord
    if (!record.id) record.id = `${now}_${Math.random().toString(36).slice(2, 8)}`
    record.updatedAt = now
    await commentStore.setItem(String(record.id), record)
  }
  return items as CommentRecord[]
}

export const clearComments = async (): Promise<void> => {
  await commentStore.clear()
}

/** AI 生成历史 */
export const saveGeneration = async (record: GenerationRecord): Promise<void> => {
  await generationStore.setItem(String(record.id || Date.now()), record)
}
