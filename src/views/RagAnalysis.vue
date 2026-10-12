<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Space } from 'ant-design-vue'
import { useRagStore } from '../stores/rag'
import { useSettingsStore } from '../stores/settings'
import { listModels } from '../api/llm'
import { parseTextFile } from '../utils/excel'
import type { LLMBackend, StreamGenerateParams } from '../types/llm'

const store = useRagStore()
const settings = useSettingsStore()
const question = ref('')
const model = ref('')
const models = ref<string[]>([])

/** 当前生效的后端配置 */
const backendCfg = (): { backend: LLMBackend; model: string; apiKey?: string; baseUrl?: string } => {
  return settings.llm.backend === 'dashscope'
    ? {
        backend: 'dashscope',
        model: settings.llm.dashscope.model,
        apiKey: settings.llm.dashscope.apiKey,
        baseUrl: settings.llm.dashscope.baseUrl
      }
    : { backend: 'ollama', model: settings.llm.ollamaModel }
}

const loadModels = async () => {
  model.value = settings.currentModel()
  try {
    models.value = await listModels(backendCfg())
    if (!model.value && models.value.length) model.value = models.value[0]
  } catch {
    models.value = []
    message.warning('未获取到模型，请先在「模型设置」中配置并测试连接')
  }
}

const handleUpload = async ({ file }: { file: File }) => {
  const isTxt = file.type === 'text/plain' || /\.(txt|csv)$/i.test(file.name)
  if (!isTxt) {
    message.error('请上传 .txt 或 .csv 文件')
    return false
  }
  try {
    const text = await parseTextFile(file)
    const count = await store.importComments(text)
    message.success(`已导入 ${count} 条评论，建立 ${store.indexedCount} 个检索片段`)
  } catch (e) {
    message.error('导入失败：' + (e instanceof Error ? e.message : String(e)))
  }
  return false
}

const ask = async () => {
  if (!question.value.trim()) {
    message.warning('请输入要分析的问题')
    return
  }
  if (!model.value) {
    message.warning('请选择模型')
    return
  }
  // store.ask 的 cfg 形参类型含 prompt，内部会用真实 prompt 覆盖，此处传入运行时配置即可
  await store.ask(question.value, { cfg: backendCfg() as StreamGenerateParams })
}

const clearAll = async () => {
  await store.clearAll()
  message.success('已清空评论数据')
}

onMounted(async () => {
  await store.rebuild()
  await settings.load()
  await loadModels()
})
</script>

<template>
  <div>
    <a-card>
      <a-space wrap>
        <a-upload :show-upload-list="false" :before-upload="handleUpload" accept=".txt,.csv">
          <a-button>上传评论文件 (.txt/.csv)</a-button>
        </a-upload>
        <a-popconfirm title="确认清空所有评论数据？" @confirm="clearAll">
          <a-button danger>清空数据</a-button>
        </a-popconfirm>
        <span style="color: #888">已建立 {{ store.indexedCount }} 个检索片段（本地索引，数据不出浏览器）</span>
        <a-tag :color="settings.llm.backend === 'dashscope' ? 'blue' : 'green'">
          {{ settings.llm.backend === 'dashscope' ? '阿里云百炼' : 'Ollama' }}
        </a-tag>
      </a-space>
    </a-card>

    <a-card title="RAG 竞品分析问答" style="margin-top: 16px">
      <Space.Compact style="width: 100%; display: flex">
        <a-input
          v-model:value="question"
          placeholder="例如：这个产品的主要差评是什么？爆款卖点有哪些？"
          style="flex: 1"
          @press-enter="ask"
        />
        <a-select
          v-model:value="model"
          :options="models.map((m) => ({ value: m, label: m }))"
          style="width: 200px"
          placeholder="模型"
          show-search
          allow-clear
        />
        <a-button type="primary" :loading="store.answering" @click="ask">
          {{ store.answering ? '分析中...' : '开始分析' }}
        </a-button>
      </Space.Compact>

      <div style="margin-top: 16px">
        <a-skeleton v-if="store.answering && !store.answer" active />
        <pre v-else-if="store.answer" class="answer-box">{{ store.answer }}</pre>
        <a-empty v-else description="上传评论并提问后，将基于本地召回片段生成分析结论" />
      </div>
      <a-alert
        v-if="store.error"
        type="error"
        show-icon
        :message="store.error"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>

<style scoped>
.answer-box {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  max-height: 480px;
  overflow-y: auto;
  font-size: 14px;
}
</style>
