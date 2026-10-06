import localforage from 'localforage'

// 统一数据库配置
const DB_NAME = 'cross-border-agent'

// 商品数据存储
export const productStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'products'
})

// 竞品评论存储（原始文本 + 分片向量）
export const commentStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'comments'
})

// AI 生成历史
export const generationStore = localforage.createInstance({
  name: DB_NAME,
  storeName: 'generations'
})

/** 商品 CRUD */
export async function getAllProducts() {
  const list = []
  await productStore.iterate((value) => list.push(value))
  return list
}

export async function getProduct(id) {
  return productStore.getItem(String(id))
}

export async function saveProduct(product) {
  if (!product.id) {
    product.id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
  product.updatedAt = Date.now()
  await productStore.setItem(String(product.id), product)
  return product
}

export async function deleteProduct(id) {
  await productStore.removeItem(String(id))
}

/** 评论（竞品）CRUD */
export async function getAllComments() {
  const list = []
  await commentStore.iterate((value) => list.push(value))
  return list
}

export async function saveComments(items) {
  const now = Date.now()
  for (const item of items) {
    if (!item.id) item.id = `${now}_${Math.random().toString(36).slice(2, 8)}`
    item.updatedAt = now
    await commentStore.setItem(String(item.id), item)
  }
  return items
}

export async function clearComments() {
  await commentStore.clear()
}

/** AI 生成历史 */
export async function saveGeneration(record) {
  await generationStore.setItem(String(record.id || Date.now()), record)
}
