<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useProductStore } from '../stores/product'
import { sourceFields, fieldGroups } from '../utils/field-map'
import { parseFileToRows, parseTextFile, exportSheet } from '../utils/excel'

const store = useProductStore()

const modalOpen = ref(false)
const editing = ref(null) // 正在编辑的商品对象
const form = reactive({})
const submitting = ref(false)
const fileInput = ref(null)

// 按分组返回字段列表
const groupedFields = fieldGroups.map((group) => ({
  group,
  fields: sourceFields.filter((f) => f.group === group)
}))

// 表头（字段 label 或 key）→ 字段 key 的映射
const headerKeyMap = {}
for (const f of sourceFields) {
  headerKeyMap[f.key] = f.key
  headerKeyMap[f.label] = f.key
}

// 初始化空表单
const resetForm = () => {
  for (const f of sourceFields) {
    form[f.key] = ''
  }
}

const openCreate = () => {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

const openEdit = (record) => {
  editing.value = record
  for (const f of sourceFields) {
    form[f.key] = record[f.key] ?? ''
  }
  modalOpen.value = true
}

const submit = async () => {
  submitting.value = true
  try {
    if (editing.value) {
      await store.update({ ...editing.value, ...form })
      message.success('商品已更新')
    } else {
      await store.add({ ...form })
      message.success('商品已创建')
    }
    modalOpen.value = false
  } catch (e) {
    message.error(e.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const remove = async (record) => {
  await store.remove(record.id)
  message.success('已删除')
}

onMounted(() => store.load())

// ── 批量导入 ──
const openImport = () => {
  fileInput.value?.click()
}

/** 下载批量导入模板（表头为字段中文名，填好数据后可直接导入） */
const downloadTemplate = () => {
  const row = {}
  for (const f of sourceFields) row[f.label] = ''
  exportSheet([row], '商品批量导入模板')
}

/** 解析一行 CSV（支持双引号包裹与转义） */
const csvLine = (line) => {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else if (c === '"') {
      inQ = true
    } else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (!lines.length) return []
  const header = csvLine(lines[0]).map((h) => h.trim())
  return lines
    .slice(1)
    .map((line) => {
      const cells = csvLine(line)
      const row = {}
      header.forEach((h, i) => {
        row[h] = (cells[i] ?? '').trim()
      })
      return row
    })
    .filter((r) => Object.values(r).some((v) => v !== ''))
}

/** 把任意表头行映射到源字段 key，丢弃无法识别的列与空行 */
const normalizeRow = (row) => {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === '' || v == null) continue
    const key = headerKeyMap[String(k).trim()]
    if (key) out[key] = v
  }
  return out
}

const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    let rows = []
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      rows = await parseFileToRows(file)
    } else if (/\.csv$/i.test(file.name)) {
      rows = parseCSV(await parseTextFile(file))
    } else if (/\.json$/i.test(file.name)) {
      const raw = JSON.parse(await parseTextFile(file))
      rows = Array.isArray(raw) ? raw : []
    } else {
      message.error('仅支持 CSV / Excel / JSON 文件')
      return
    }
    const items = rows.map(normalizeRow).filter((r) => Object.keys(r).length > 0)
    if (!items.length) {
      message.warning('未从文件中识别到有效商品数据')
      return
    }
    const saved = await store.batchAdd(items)
    message.success(`成功导入 ${saved.length} 条商品`)
  } catch (err) {
    message.error(err.message || '导入失败，请检查文件格式与表头')
  }
}

/** 取商品主图（images 为逗号分隔 URL，取第一张） */
const firstImage = (src) => {
  return String(src || '').split(',')[0].trim() || ''
}

const columns = [
  { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 130 },
  { title: '图片', key: 'image', width: 64, slots: { customRender: 'image' } },
  { title: '标题', dataIndex: 'name', key: 'name', width: 180, slots: { customRender: 'name' } },
  { title: '品牌', dataIndex: 'brand', key: 'brand', width: 110 },
  { title: '售价', dataIndex: 'price', key: 'price', width: 90 },
  { title: '库存', dataIndex: 'stock', key: 'stock', width: 90 },
  {
    title: '操作',
    key: 'action',
    width: 140,
    slots: { customRender: 'action' }
  }
]
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <a-space>
        <a-button type="primary" @click="openCreate">＋ 新增商品</a-button>
        <a-button @click="openImport">⇪ 批量新增商品</a-button>
        <a-button @click="downloadTemplate">⇩ 下载模板</a-button>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          style="display: none"
          @change="handleFileChange"
        />
      </a-space>
      <span style="color: #888">共 {{ store.count }} 件商品 · 数据保存在本地浏览器</span>
    </div>

    <a-table
      :columns="columns"
      :data-source="store.products"
      :loading="store.loading"
      row-key="id"
      :pagination="{ pageSize: 10 }"
    >
      <template #name="{ record }">
        <a-tooltip :title="record.name" placement="top">
          <span
            style="display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
          >{{ record.name }}</span>
        </a-tooltip>
      </template>
      <template #image="{ record }">
        <a-tooltip v-if="firstImage(record.images)" placement="right">
          <template #title>
            <img
              :src="firstImage(record.images)"
              style="max-width: 220px; max-height: 220px; border-radius: 4px; display: block"
            />
          </template>
          <img
            :src="firstImage(record.images)"
            style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; cursor: zoom-in"
          />
        </a-tooltip>
        <span v-else style="color: #bbb">—</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a @click="openEdit(record)">编辑</a>
          <a-popconfirm title="确认删除该商品？" @confirm="remove(record)">
            <a style="color: #f5222d">删除</a>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="editing ? '编辑商品' : '新增商品'"
      :confirm-loading="submitting"
      @ok="submit"
      ok-text="保存"
      cancel-text="取消"
      width="760px"
      :body-style="{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', overflowX: 'hidden' }"
    >
      <a-form layout="vertical">
        <template v-for="gf in groupedFields" :key="gf.group">
          <a-divider orientation="left">{{ gf.group }}</a-divider>
          <a-row :gutter="16">
            <a-col
              v-for="f in gf.fields"
              :key="f.key"
              :span="f.type === 'textarea' ? 24 : 12"
            >
              <a-form-item
                :label="f.required ? `${f.label} *` : f.label"
              >
                <a-input
                  v-if="f.type === 'text' || f.type === 'number'"
                  v-model:value="form[f.key]"
                  :type="f.type === 'number' ? 'number' : 'text'"
                  :placeholder="`请输入${f.label}`"
                />
                <a-textarea
                  v-else
                  v-model:value="form[f.key]"
                  :rows="f.key === 'attributes' ? 4 : 5"
                  :placeholder="`请输入${f.label}`"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>
