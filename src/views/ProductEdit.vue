<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useProductStore } from '../stores/product'
import { sourceFields } from '../utils/field-map'

const store = useProductStore()

const modalOpen = ref(false)
const editing = ref(null) // 正在编辑的商品对象
const form = reactive({})
const submitting = ref(false)

// 初始化空表单
function resetForm() {
  for (const f of sourceFields) {
    form[f.key] = ''
  }
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(record) {
  editing.value = record
  for (const f of sourceFields) {
    form[f.key] = record[f.key] ?? ''
  }
  modalOpen.value = true
}

async function submit() {
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

async function remove(record) {
  await store.remove(record.id)
  message.success('已删除')
}

onMounted(() => store.load())

const columns = [
  { title: 'SKU', dataIndex: 'sku', key: 'sku' },
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '类目', dataIndex: 'category', key: 'category' },
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
      <a-button type="primary" @click="openCreate">＋ 新增商品</a-button>
      <span style="color: #888">共 {{ store.count }} 件商品 · 数据保存在本地浏览器</span>
    </div>

    <a-table
      :columns="columns"
      :data-source="store.products"
      :loading="store.loading"
      row-key="id"
      :pagination="{ pageSize: 10 }"
    >
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
      width="640px"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col
            v-for="f in sourceFields"
            :key="f.key"
            :span="f.type === 'textarea' ? 24 : 12"
          >
            <a-form-item :label="f.label">
              <a-input
                v-if="f.type === 'text' || f.type === 'number'"
                v-model:value="form[f.key]"
                :type="f.type === 'number' ? 'number' : 'text'"
                :placeholder="`请输入${f.label}`"
              />
              <a-textarea
                v-else
                v-model:value="form[f.key]"
                :rows="f.key === 'attributes' ? 4 : 6"
                :placeholder="`请输入${f.label}`"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>
