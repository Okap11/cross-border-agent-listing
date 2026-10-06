<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { useProductStore } from '../stores/product'
import { platformSchema, mapToPlatform } from '../utils/field-map'
import { exportCsv } from '../utils/excel'

const store = useProductStore()
const platform = ref('ozon')

const platformOptions = [
  { value: 'ozon', label: 'Ozon' },
  { value: 'shein', label: 'Shein Choice' }
]

const schemaEntries = computed(() =>
  Object.entries(platformSchema[platform.value]).map(([key, meta]) => ({ key, ...meta }))
)

const mappedRows = computed(() =>
  store.products.map((p) => mapToPlatform(p, platform.value))
)

const previewColumns = computed(() =>
  Object.keys(platformSchema[platform.value]).map((key) => ({
    title: platformSchema[platform.value][key].label,
    dataIndex: platformSchema[platform.value][key].label,
    key,
    ellipsis: true
  }))
)

function doExport() {
  if (!mappedRows.value.length) {
    message.warning('暂无可导出的商品，请先在「商品管理」录入')
    return
  }
  exportCsv(mappedRows.value, `cross-border-${platform.value}-listing`)
  message.success(`已导出 ${platform.value === 'ozon' ? 'Ozon' : 'Shein'} 上架模板 (${mappedRows.value.length} 条)`)
}

onMounted(() => store.load())
</script>

<template>
  <div>
    <a-card>
      <a-space wrap>
        <span>目标平台：</span>
        <a-select
          v-model:value="platform"
          :options="platformOptions"
          style="width: 200px"
        />
        <a-button type="primary" @click="doExport">导出上架 CSV</a-button>
      </a-space>
    </a-card>

    <a-card title="字段映射规则" style="margin-top: 16px">
      <a-table
        :columns="[
          { title: '源字段', dataIndex: 'key', key: 'key' },
          { title: '平台字段', dataIndex: 'label', key: 'label' },
          { title: '是否必填', dataIndex: 'required', key: 'required', width: 100 }
        ]"
        :data-source="schemaEntries"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'required'">
            <a-tag v-if="record.required" color="red">必填</a-tag>
            <a-tag v-else>选填</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card title="导出预览" style="margin-top: 16px">
      <a-table
        :columns="previewColumns"
        :data-source="mappedRows"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 900 }"
        row-key="id"
      />
    </a-card>
  </div>
</template>
