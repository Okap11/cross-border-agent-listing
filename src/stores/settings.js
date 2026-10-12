import { defineStore } from 'pinia'
import localforage from 'localforage'

const settingsInstance = localforage.createInstance({
  name: 'cross-border-agent',
  storeName: 'settings'
})

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    llm: {
      backend: 'dashscope', // 'ollama' | 'dashscope'
      ollamaModel: '', // 本地 Ollama 模型名
      dashscope: {
        apiKey: '', // 阿里百炼 API Key
        model: 'qwen-plus', // 百炼模型
        baseUrl: 'https://dashscope.aliyuncs.com' // 北京地域，可按需修改
      }
    },
    loaded: false
  }),
  actions: {
    /** 从本地加载配置 */
    async load() {
      const saved = await settingsInstance.getItem('llm')
      if (saved) {
        this.llm = {
          backend: saved.backend || 'dashscope',
          ollamaModel: saved.ollamaModel || '',
          dashscope: { ...this.llm.dashscope, ...(saved.dashscope || {}) }
        }
      }
      this.loaded = true
    },
    /** 保存配置到本地 */
    async save() {
      await settingsInstance.setItem('llm', this.llm)
    },
    /** 便捷：返回当前生效的模型名 */
    currentModel() {
      return this.llm.backend === 'dashscope' ? this.llm.dashscope.model : this.llm.ollamaModel
    }
  }
})
