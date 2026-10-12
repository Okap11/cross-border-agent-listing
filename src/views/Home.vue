<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../stores/product'
import { useRagStore } from '../stores/rag'
import { useSettingsStore } from '../stores/settings'
import { checkBackend } from '../api/llm'
import type { LLMBackend } from '../types/llm'

const router = useRouter()
const productStore = useProductStore()
const ragStore = useRagStore()
const settings = useSettingsStore()

const backendOnline = ref(false)
const checking = ref(true)
const backendLabel = ref('')

const features = [
  {
    title: '商品管理',
    desc: '录入统一源商品数据，本地 IndexedDB 存储',
    route: '/product',
    icon: '🛍️'
  },
  {
    title: '字段映射',
    desc: '一键映射导出 Ozon / Shein Choice 上架模板',
    route: '/mapping',
    icon: '🔁'
  },
  {
    title: 'AI Listing 生成',
    desc: '接入 Ollama / 阿里百炼，流式生成多平台文案',
    route: '/ai-generate',
    icon: '🤖'
  },
  {
    title: '竞品评论分析',
    desc: '导入评论 CSV，本地 RAG 挖掘卖点与差评痛点',
    route: '/rag',
    icon: '📊'
  }
]

onMounted(async () => {
  await Promise.all([productStore.load(), ragStore.rebuild(), settings.load()])
  const cfg: { backend: LLMBackend; apiKey?: string; baseUrl?: string } =
    settings.llm.backend === 'dashscope'
      ? {
          backend: 'dashscope',
          apiKey: settings.llm.dashscope.apiKey,
          baseUrl: settings.llm.dashscope.baseUrl
        }
      : { backend: 'ollama' }
  const result = await checkBackend(cfg)
  backendOnline.value = result.online
  backendLabel.value = settings.llm.backend === 'dashscope' ? '阿里云百炼' : 'Ollama'
  checking.value = false
})
</script>

<template>
  <div>
    <a-alert
      v-if="!checking && !backendOnline"
      type="warning"
      show-icon
      :message="`未检测到可用的 AI 后端（${backendLabel}）`"
      description="AI 相关功能需要先在「模型设置」中配置并测试连接（Ollama 需本地启动；百炼需 API Key）。商品管理与字段映射不受影响。"
      style="margin-bottom: 16px"
    >
      <template #action>
        <a-button size="small" @click="router.push('/settings')">前往模型设置</a-button>
      </template>
    </a-alert>
    <a-alert
      v-else-if="!checking && backendOnline"
      type="success"
      show-icon
      :message="`AI 后端已就绪（${backendLabel}）`"
      style="margin-bottom: 16px"
    />

    <a-row :gutter="[16, 16]">
      <a-col :span="6">
        <a-card>
          <a-statistic title="已录入商品" :value="productStore.count" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="竞品评论片段" :value="ragStore.indexedCount" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="支持平台" :value="2" suffix="个" />
        </a-card>
      </a-col>
    </a-row>

    <h3 style="margin-top: 24px">核心功能</h3>
    <a-row :gutter="[16, 16]">
      <a-col
        v-for="f in features"
        :key="f.route"
        :xs="24"
        :sm="12"
        :md="6"
      >
        <a-card hoverable @click="router.push(f.route)">
          <div style="font-size: 28px">{{ f.icon }}</div>
          <h4 style="margin: 8px 0 4px">{{ f.title }}</h4>
          <p style="color: #888; margin: 0">{{ f.desc }}</p>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="关于本项目" style="margin-top: 16px">
      <p>
        <b>cross-border-agent-listing</b> —— 本地优先的 Ozon & Shein Choice
        跨境 Listing 智能工作台。所有数据默认保存在浏览器本地，敏感商品信息不上传任何第三方服务器。
      </p>
      <p>
        技术栈：Vue 3 · Vite · Ant Design Vue · Pinia · IndexedDB(localforage) · Ollama / 阿里百炼 · 本地向量检索
      </p>
    </a-card>
  </div>
</template>
