<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useRagStore } from '../stores/rag'
import { listOllamaModels } from '../api/ollama'
import { parseTextFile } from '../utils/excel'

const store = useRagStore()
const question = ref('')
const model = ref('')
const models = ref([])

async function loadModels() {
  try {
    models.value = await listOllamaModels()
    if (models.value.length && !model.value) model.value = models.value[0]
  } catch {
    models.value = []
    message.warning('未能连接到 Ollama，问答需要本地模型')
  }
}

async function handleUpload({ file }) {
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
    message.error('导入失败：' + e.message)
  }
  return false
}

async function ask() {
  if (!question.value.trim()) {
    message.warning('请输入要分析的问题')
    return
  }
  if (!model.value) {
    message.warning('请选择模型')
    return
  }
  await store.ask(question.value, { model: model.value })
}

async function clearAll() {
  await store.clearAll()
  message.success('已清空评论数据')
}

onMounted(async () => {
  await store.rebuild()
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
      </a-space>
    </a-card>

    <a-card title="RAG 竞品分析问答" style="margin-top: 16px">
      <a-space.Compact style="width: 100%; display: flex">
        <a-input
          v-model:value="question"
          placeholder="例如：这个产品的主要差评是什么？爆款卖点有哪些？"
          style="flex: 1"
          @press-enter="ask"
        />
        <a-select
          v-model:value="model"
          :options="models.map((m) => ({ value: m, label: m }))"
          style="width: 180px"
          placeholder="模型"
        />
        <a-button type="primary" :loading="store.answering" @click="ask">
          {{ store.answering ? '分析中...' : '开始分析' }}
        </a-button>
      </a-space.Compact>

      <div style="margin-top: 16px">
        <a-skeleton v-if="store.answering && !store.answer" active />
        <pre v-else-if="store.answer" class="answer-box">{{ store.answer }}</pre>
        <a-empty
          v-else
          description="上传评论并提问后，将基于本地召回片段由 Ollama 生成分析结论"
        />
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
