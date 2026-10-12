import { defineStore } from 'pinia'
import type { Product, ProductInput } from '../types/product'
import {
  getAllProducts,
  saveProduct,
  saveProducts,
  deleteProduct
} from '../utils/db'

export const useProductStore = defineStore('product', {
  state: (): { products: Product[]; loading: boolean; error: string | null } => ({
    products: [],
    loading: false,
    error: null
  }),
  getters: {
    count: (state) => state.products.length
  },
  actions: {
    async load() {
      this.loading = true
      try {
        this.products = (await getAllProducts()) as Product[]
      } catch (e) {
        this.error = e instanceof Error ? e.message : String(e)
      } finally {
        this.loading = false
      }
    },
    async add(product: ProductInput): Promise<Product> {
      const saved = await saveProduct(product)
      await this.load()
      return saved as Product
    },
    async batchAdd(products: ProductInput[]): Promise<Product[]> {
      const saved = await saveProducts(products)
      await this.load()
      return saved as Product[]
    },
    async update(product: ProductInput): Promise<Product> {
      const saved = await saveProduct(product)
      await this.load()
      return saved as Product
    },
    async remove(id: string) {
      await deleteProduct(id)
      await this.load()
    }
  }
})
