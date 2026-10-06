# cross-border-agent-listing

> Local-first AI listing workspace for Ozon & Shein Choice.
> 本地优先的 Ozon / Shein Choice 跨境 Listing 智能工作台。

面向跨境卖家，统一管理商品源数据，一键映射导出多平台上架模板，并基于本地大模型（Ollama）智能生成 Listing 文案、分析竞品评论。**所有数据默认保存在浏览器本地，敏感商品信息不上传任何第三方服务器。**

## ✨ Features

- ✅ **统一商品管理**：录入统一源商品数据，IndexedDB 本地持久化
- ✅ **多平台字段映射**：一键将源数据映射导出为 Ozon / Shein Choice 上架 CSV 模板
- ✅ **AI Listing 生成**：接入 Ollama 本地大模型，SSE 流式输出多平台标题、五点描述、关键词
- ✅ **竞品评论 RAG 分析**：导入评论文件，本地建索引检索，自动挖掘卖点与差评痛点
- ✅ **Local-First**：全部数据保存在浏览器 IndexedDB，无后端、可离线
- ✅ 纯前端静态页面，可部署到 GitHub Pages / Vercel 等任意静态托管

## 🛠 Tech Stack

- 框架：Vue 3（`<script setup>`）+ Vite
- UI：Ant Design Vue 4 + @ant-design/icons-vue
- 状态：Pinia
- 路由：Vue Router 4（hash 模式，适配静态部署）
- 本地存储：localforage（IndexedDB）
- 表格处理：xlsx
- LLM：Ollama HTTP API（SSE 流式）
- 向量检索：本地 TF 检索（可替换为 Ollama embedding + sqlite-vss wasm）
- 代码规范：ESLint + Prettier

## 🚀 Quick Start

### 1. 启动 Ollama（AI 功能可选）

```bash
ollama pull qwen2:7b
ollama serve
```

> 开发环境下前端通过 Vite 代理访问 `http://127.0.0.1:11434`，无需额外跨域配置。未启动 Ollama 时，商品管理与字段映射功能仍可正常使用。

### 2. 安装与启动项目

```bash
git clone https://github.com/<your-name>/cross-border-agent-listing.git
cd cross-border-agent-listing
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

### 3. 构建与检查

```bash
npm run build     # 生产构建，输出到 dist/
npm run lint      # ESLint 检查
npm run format    # Prettier 格式化
```

## 📂 项目结构

```
cross-border-agent-listing/
├── .github/                  # GitHub 配置（CI 等）
├── public/
├── src/
│   ├── api/
│   │   └── ollama.js         # Ollama 接口封装（SSE 流式、模型列表、健康检查）
│   ├── assets/
│   ├── components/           # 通用 / 业务组件
│   ├── router/index.js       # 路由配置（懒加载）
│   ├── stores/
│   │   ├── product.js        # 商品 store
│   │   └── rag.js            # 竞品评论 RAG store
│   ├── utils/
│   │   ├── db.js             # IndexedDB(localforage) 封装
│   │   ├── excel.js          # xlsx 导入导出
│   │   ├── field-map.js      # Ozon / Shein 字段 Schema 与映射
│   │   ├── prompt.js         # 平台专用 Prompt 模板
│   │   └── vector.js         # 本地向量检索（可替换）
│   ├── views/
│   │   ├── Home.vue          # 工作台
│   │   ├── ProductEdit.vue   # 商品管理
│   │   ├── FieldMapping.vue  # 字段映射与导出
│   │   ├── AiGenerate.vue    # AI Listing 生成
│   │   └── RagAnalysis.vue   # 竞品评论分析
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── vite.config.js            # Vite + /ollama 代理配置
├── eslint.config.js
├── .prettierrc.json
└── package.json
```

## 📌 Roadmap

- **v0.1（当前 MVP）**：商品管理、字段映射导出、AI Listing 流式生成、基础评论 RAG
- v0.2：MCP Skill 支持，接入 Claude Code / OpenClaw
- v0.3：图片 Wasm 压缩、背景去除、场景图生成
- v0.4：语义检索升级（Ollama embedding + sqlite-vss wasm）
- v0.5：浏览器扩展版本

## ⚠️ Notice

本项目用于个人学习与自用，请勿用于商业用途。使用前请遵守各跨境电商平台的使用条款。
