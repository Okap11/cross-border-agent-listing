<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useSettingsStore } from '../stores/settings'
import { listModels, checkBackend } from '../api/llm'

const store = useSettingsStore()

const form = reactive({
  backend: 'dashscope',
  ollamaModel: '',
  dashscopeApiKey: '',
  dashscopeModel: 'qwen-plus',
  dashscopeBaseUrl: 'https://dashscope.aliyuncs.com'
})

const dashscopeModels = ref([])
const ollamaModels = ref([])
const checking = ref(false)
const backendOnline = ref(false)
const checked = ref(false)

const backendOptions = [
  { value: 'ollama', label: 'Ollama（本地大模型）' },
  { value: 'dashscope', label: '阿里云百炼（DashScope）' }
]

// 从 store 初始化表单
const syncFromStore = () => {
  form.backend = store.llm.backend
  form.ollamaModel = store.llm.ollamaModel
  form.dashscopeApiKey = store.llm.dashscope.apiKey
  form.dashscopeModel = store.llm.dashscope.model
  form.dashscopeBaseUrl = store.llm.dashscope.baseUrl
}

const syncToStore = () => {
  store.llm.backend = form.backend
  store.llm.ollamaModel = form.ollamaModel
  store.llm.dashscope.apiKey = form.dashscopeApiKey
  store.llm.dashscope.model = form.dashscopeModel
  store.llm.dashscope.baseUrl = form.dashscopeBaseUrl
}

const loadModelLists = async () => {
  // 加载 Ollama 模型
  try {
    ollamaModels.value = await listModels({ backend: 'ollama' })
  } catch {
    ollamaModels.value = []
  }
  // 加载百炼模型（需已填 Key）
  if (form.dashscopeApiKey) {
    try {
      dashscopeModels.value = await listModels({
        backend: 'dashscope',
        apiKey: form.dashscopeApiKey,
        baseUrl: form.dashscopeBaseUrl
      })
    } catch {
      dashscopeModels.value = []
    }
  }
}

const testConnection = async () => {
  syncToStore()
  checking.value = true
  checked.value = false
  try {
    const cfg = backendCfg()
    const result = await checkBackend(cfg)
    backendOnline.value = result.online
    checked.value = true
    if (result.online) {
      message.success(result.backend === 'dashscope' ? '百炼连接成功' : 'Ollama 连接成功')
    } else {
      message.error(result.backend === 'dashscope' ? '百炼连接失败，请检查 API Key 与网络' : 'Ollama 未检测到，请确认已启动')
    }
  } catch (e) {
    checked.value = true
    backendOnline.value = false
    message.error('连接失败：' + e.message)
  } finally {
    checking.value = false
  }
}

const backendCfg = () => {
  return form.backend === 'dashscope'
    ? {
        backend: 'dashscope',
        model: form.dashscopeModel,
        apiKey: form.dashscopeApiKey,
        baseUrl: form.dashscopeBaseUrl
      }
    : { backend: 'ollama', model: form.ollamaModel }
}

const save = async () => {
  syncToStore()
  await store.save()
  message.success('配置已保存到本地')
}

// 表单变更后自动持久化（300ms 防抖），刷新后仍保持选择，无需手动点保存
let saveTimer = null
watch(
  form,
  () => {
    syncToStore()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => store.save(), 300)
  },
  { deep: true }
)

const loadDashscopeModels = async () => {
  if (!form.dashscopeApiKey) {
    message.warning('请先填写百炼 API Key')
    return
  }
  try {
    dashscopeModels.value = await listModels({
      backend: 'dashscope',
      apiKey: form.dashscopeApiKey,
      baseUrl: form.dashscopeBaseUrl
    })
    if (dashscopeModels.value.length) message.success(`已获取 ${dashscopeModels.value.length} 个模型`)
    else message.info('未获取到模型，可直接手动输入模型名')
  } catch (e) {
    dashscopeModels.value = []
    message.error('获取模型失败：' + e.message)
  }
}

onMounted(async () => {
  await store.load()
  syncFromStore()
  await loadModelLists()
})
</script>

<template>
  <div>
    <a-card title="LLM 后端配置">
      <a-form layout="vertical" style="max-width: 680px">
        <a-form-item label="后端服务">
          <a-radio-group v-model:value="form.backend" :options="backendOptions" />
        </a-form-item>

        <template v-if="form.backend === 'ollama'">
          <a-form-item label="Ollama 模型">
            <a-select
              v-model:value="form.ollamaModel"
              :options="ollamaModels.map((m) => ({ value: m, label: m }))"
              placeholder="选择本地模型（如 qwen2:7b）"
              show-search
              allow-clear
            />
            <div class="hint">
              需要本地已安装 Ollama 并拉取模型（<code>ollama pull qwen2:7b</code> 后 <code>ollama serve</code>）。
            </div>
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="阿里百炼 API Key">
            <a-input-password
              v-model:value="form.dashscopeApiKey"
              placeholder="sk-..."
              autocomplete="new-password"
            />
            <div class="hint">
              在 <a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener">阿里云百炼控制台</a> 获取，
              仅保存在浏览器本地（Local-First）。
            </div>
          </a-form-item>

          <a-form-item label="模型">
            <a-space>
              <a-select
                v-model:value="form.dashscopeModel"
                :options="dashscopeModels.map((m) => ({ value: m, label: m }))"
                style="width: 280px"
                placeholder="选择或输入模型（如 qwen-plus）"
                show-search
                allow-clear
              />
              <a-button @click="loadDashscopeModels">获取模型列表</a-button>
            </a-space>
            <div class="hint">常用：qwen-plus / qwen-max / qwen-turbo / qwen-flash</div>
          </a-form-item>

          <a-form-item label="Base URL">
            <a-input v-model:value="form.dashscopeBaseUrl" />
            <div class="hint">
              默认北京地域 <code>https://dashscope.aliyuncs.com</code>；
              其他地域请替换为对应接入域名，如新加坡
              <code>https://dashscope-intl.aliyuncs.com</code>。
            </div>
          </a-form-item>
        </template>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="checking" @click="testConnection">
              测试连接
            </a-button>
            <a-button @click="save">保存配置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-alert
        v-if="checked"
        :type="backendOnline ? 'success' : 'error'"
        show-icon
        :message="backendOnline ? `后端（${form.backend}）连接正常` : '后端连接失败，请检查配置与网络'"
        style="max-width: 680px"
      />

      <a-divider />
      <a-alert
        type="info"
        show-icon
        message="关于生产环境的说明"
        description="本地开发（npm run dev）通过 Vite 代理调用百炼接口，无跨域问题。部署到 GitHub Pages 等纯静态环境时，浏览器直接调用百炼会受跨域限制，需自行配置同源代理（如 Vercel Functions / 云函数）或使用支持 CORS 的网关。"
        style="max-width: 680px"
      />
    </a-card>
  </div>
</template>

<style scoped>
.hint {
  color: #888;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.6;
}
code {
  background: #f5f5f5;
  padding: 0 4px;
  border-radius: 3px;
}
</style>
