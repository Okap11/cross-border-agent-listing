import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/cross-border-agent-listing/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    // 将 /ollama 代理到本地 Ollama 服务，规避浏览器 CORS
    proxy: {
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, '')
      }
    }
  },
  build: {
    // 提示大块提示，但允许（antdv 全量引入体积较大）
    chunkSizeWarningLimit: 1500
  }
})
