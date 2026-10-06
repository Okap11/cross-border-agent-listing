<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../stores/product'
import { useRagStore } from '../stores/rag'
import { checkOllama } from '../api/ollama'

const router = useRouter()
const productStore = useProductStore()
const ragStore = useRagStore()
const ollamaOnline = ref(false)
const checkingOllama = ref(true)

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
    desc: '接入 Ollama 本地大模型，流式生成多平台文案',
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
  await Promise.all([productStore.load(), ragStore.rebuild()])
  ollamaOnline.value = await checkOllama()
  checkingOllama.value = false
})
</script>

<template>
  <div>
    <a-alert
      v-if="!checkingOllama && !ollamaOnline"
      type="warning"
      show-icon
      message="未检测到本地 Ollama 服务"
      description="AI 相关功能需要先启动 Ollama 并拉取模型（如 qwen2:7b），详见 README。商品管理与字段映射不受影响。"
      style="margin-bottom: 16px"
    />
    <a-alert
      v-else-if="!checkingOllama && ollamaOnline"
      type="success"
      show-icon
      message="Ollama 服务已就绪"
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
        技术栈：Vue 3 · Vite · Ant Design Vue · Pinia · IndexedDB(localforage) · Ollama · 本地向量检索
      </p>
    </a-card>
  </div>
</template>
