import { defineStore } from 'pinia'
import localforage from 'localforage'
import { DB_NAME, SETTINGS_STORE } from '../constants/storage'
import { DEFAULT_LLM_SETTINGS } from '../constants/llm'
import type { LLMSettings, LLMBackend, DashscopeConfig } from '../types/llm'

const settingsInstance = localforage.createInstance({
  name: DB_NAME,
  storeName: SETTINGS_STORE
})

export const useSettingsStore = defineStore('settings', {
  state: (): { llm: LLMSettings; loaded: boolean } => ({
    // 深拷贝默认值，保证每个 store 实例持有独立的嵌套对象
    llm: {
      backend: DEFAULT_LLM_SETTINGS.backend,
      ollamaModel: DEFAULT_LLM_SETTINGS.ollamaModel,
      dashscope: { ...DEFAULT_LLM_SETTINGS.dashscope }
    },
    loaded: false
  }),
  actions: {
    /** 从本地加载配置 */
    async load() {
      // localforage 反序列化结果不可信，按 unknown 处理并做类型收窄
      const saved: unknown = await settingsInstance.getItem('llm')
      if (saved && typeof saved === 'object') {
        const s = saved as {
          backend?: unknown
          ollamaModel?: unknown
          dashscope?: unknown
        }
        // backend 可能是任意字符串，仅接受两个合法值，否则兜底 dashscope
        const backend: LLMBackend =
          s.backend === 'ollama' || s.backend === 'dashscope' ? s.backend : 'dashscope'
        const dashscope: Partial<DashscopeConfig> =
          s.dashscope && typeof s.dashscope === 'object'
            ? (s.dashscope as Partial<DashscopeConfig>)
            : {}
        this.llm = {
          backend,
          ollamaModel: typeof s.ollamaModel === 'string' ? s.ollamaModel : '',
          dashscope: { ...this.llm.dashscope, ...dashscope }
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
