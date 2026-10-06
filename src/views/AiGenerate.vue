<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useProductStore } from '../stores/product'
import { listOllamaModels, ollamaStream } from '../api/ollama'
import { getPrompt } from '../utils/prompt'

const store = useProductStore()
const platform = ref('ozon')
const model = ref('')
const models = ref([])
const selectedProductId = ref(null)
const output = ref('')
const generating = ref(false)

const platformOptions = [
  { value: 'ozon', label: 'Ozon（俄语）' },
  { value: 'shein', label: 'Shein Choice（英语）' }
]

const productOptions = computed(() =>
  store.products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.title}` : p.title }))
)

async function loadModels() {
  try {
    models.value = await listOllamaModels()
    if (models.value.length && !model.value) model.value = models.value[0]
  } catch {
    models.value = []
    message.warning('未能连接到 Ollama，请确认已启动（ollama serve）')
  }
}

function buildProductInfo(product) {
  return [
    `SKU: ${product.sku || ''}`,
    `标题: ${product.title || ''}`,
    `描述: ${product.description || ''}`,
    `类目: ${product.category || ''}`,
    `属性: ${product.attributes || ''}`,
    `售价: ${product.price || ''}`
  ].join('\n')
}

async function generate() {
  if (!selectedProductId.value) {
    message.warning('请先选择一件商品')
    return
  }
  if (!model.value) {
    message.warning('请选择模型')
    return
  }
  const product = store.products.find((p) => p.id === selectedProductId.value)
  if (!product) return

  output.value = ''
  generating.value = true
  try {
    const prompt = getPrompt(platform.value, buildProductInfo(product))
    await ollamaStream({
      model: model.value,
      prompt,
      onChunk: (t) => {
        output.value += t
      },
      onDone: () => message.success('生成完成')
    })
  } catch (e) {
    message.error(e.message || '生成失败')
  } finally {
    generating.value = false
  }
}

function copyResult() {
  navigator.clipboard?.writeText(output.value)
  message.success('已复制')
}

onMounted(async () => {
  await Promise.all([store.load(), loadModels()])
})
</script>

<template>
  <div>
    <a-card>
      <a-form layout="inline">
        <a-form-item label="平台">
          <a-select v-model:value="platform" :options="platformOptions" style="width: 180px" />
        </a-form-item>
        <a-form-item label="商品">
          <a-select
            v-model:value="selectedProductId"
            :options="productOptions"
            style="width: 320px"
            placeholder="选择要生成的商品"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item label="模型">
          <a-select
            v-model:value="model"
            :options="models.map((m) => ({ value: m, label: m }))"
            style="width: 180px"
            placeholder="Ollama 模型"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="generating" @click="generate">
            {{ generating ? '生成中...' : '生成 Listing' }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="生成结果" style="margin-top: 16px">
      <template #extra>
        <a-button size="small" :disabled="!output" @click="copyResult">复制</a-button>
      </template>
      <a-skeleton v-if="generating && !output" active />
      <pre v-else-if="output" class="output-box">{{ output }}</pre>
      <a-empty v-else description="选择商品与模型后点击生成" />
    </a-card>
  </div>
</template>

<style scoped>
.output-box {
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
