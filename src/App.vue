<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  DashboardOutlined,
  ShoppingOutlined,
  SwapOutlined,
  RobotOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const selectedKeys = ref([route.path])

const menuItems = [
  { key: '/', icon: DashboardOutlined, title: '工作台' },
  { key: '/product', icon: ShoppingOutlined, title: '商品管理' },
  { key: '/mapping', icon: SwapOutlined, title: '字段映射' },
  { key: '/ai-generate', icon: RobotOutlined, title: 'AI Listing 生成' },
  { key: '/rag', icon: BarChartOutlined, title: '竞品评论分析' }
]
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider theme="dark" collapsible>
      <div class="logo">Cross-Border Agent</div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="({ key }) => { selectedKeys = [key]; $router.push(key) }"
      >
        <a-menu-item v-for="item in menuItems" :key="item.key">
          <component :is="item.icon" />
          <span>{{ item.title }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px">
        <h2 style="margin: 0; line-height: 64px">
          {{ route.meta.title || 'Cross-Border Agent' }}
        </h2>
      </a-layout-header>
      <a-layout-content style="margin: 16px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
