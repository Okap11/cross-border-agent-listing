import { defineStore } from 'pinia'
import {
  getAllProducts,
  saveProduct,
  deleteProduct
} from '../utils/db'

export const useProductStore = defineStore('product', {
  state: () => ({
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
        this.products = await getAllProducts()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    async add(product) {
      const saved = await saveProduct(product)
      await this.load()
      return saved
    },
    async update(product) {
      const saved = await saveProduct(product)
      await this.load()
      return saved
    },
    async remove(id) {
      await deleteProduct(id)
      await this.load()
    }
  }
})
