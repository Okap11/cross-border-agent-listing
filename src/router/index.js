import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '工作台', icon: 'DashboardOutlined' }
  },
  {
    path: '/product',
    name: 'ProductEdit',
    component: () => import('../views/ProductEdit.vue'),
    meta: { title: '商品管理', icon: 'ShoppingOutlined' }
  },
  {
    path: '/mapping',
    name: 'FieldMapping',
    component: () => import('../views/FieldMapping.vue'),
    meta: { title: '字段映射', icon: 'SwapOutlined' }
  },
  {
    path: '/ai-generate',
    name: 'AiGenerate',
    component: () => import('../views/AiGenerate.vue'),
    meta: { title: 'AI Listing 生成', icon: 'RobotOutlined' }
  },
  {
    path: '/rag',
    name: 'RagAnalysis',
    component: () => import('../views/RagAnalysis.vue'),
    meta: { title: '竞品评论分析', icon: 'BarChartOutlined' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} · Cross-Border Agent`
    : 'Cross-Border Agent'
})

export default router
