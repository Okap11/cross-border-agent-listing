<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useProductStore } from '../stores/product'
import { useSettingsStore } from '../stores/settings'
import { listModels, streamGenerate } from '../api/llm'
import { getPrompt } from '../utils/prompt'
import type { Product } from '../types/product'
import type { PlatformKey } from '../types/platform'
import type { LLMBackend } from '../types/llm'

const store = useProductStore()
const settings = useSettingsStore()

const platform = ref<PlatformKey>('ozon')
const model = ref<string>('')
const models = ref<string[]>([])
const selectedProductId = ref<string | null>(null)
const output = ref('')
const generating = ref(false)

const platformOptions: { value: PlatformKey; label: string }[] = [
  { value: 'ozon', label: 'Ozon（俄语）' },
  { value: 'shein', label: 'Shein Choice（英语）' }
]

const productOptions = computed(() =>
  store.products.map((p) => ({ value: p.id, label: p.sku ? `${p.sku} - ${p.name}` : p.name }))
)

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

const buildProductInfo = (product: Product): string => {
  return [
    `SKU: ${product.sku || ''}`,
    `标题: ${product.name || ''}`,
    `描述: ${product.description || ''}`,
    `类目: ${product.category || ''}`,
    `属性: ${product.attributes || ''}`,
    `售价: ${product.price || ''}`
  ].join('\n')
}

const generate = async () => {
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
    await streamGenerate({
      ...backendCfg(),
      model: model.value,
      prompt,
      onChunk: (t: string) => {
        output.value += t
      },
      onDone: () => message.success('生成完成')
    })
  } catch (e) {
    message.error((e instanceof Error ? e.message : String(e)) || '生成失败')
  } finally {
    generating.value = false
  }
}

const copyResult = () => {
  navigator.clipboard?.writeText(output.value)
  message.success('已复制')
}

onMounted(async () => {
  await Promise.all([store.load(), settings.load()])
  await loadModels()
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
            style="width: 200px"
            :placeholder="settings.llm.backend === 'dashscope' ? '百炼模型' : 'Ollama 模型'"
            show-search
            allow-clear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="generating" @click="generate">
            {{ generating ? '生成中...' : '生成 Listing' }}
          </a-button>
        </a-form-item>
      </a-form>
      <a-space style="margin-top: 4px">
        <a-tag :color="settings.llm.backend === 'dashscope' ? 'blue' : 'green'">
          当前后端：{{ settings.llm.backend === 'dashscope' ? '阿里云百炼' : 'Ollama' }}
        </a-tag>
        <a @click="$router.push('/settings')">前往模型设置</a>
      </a-space>
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
