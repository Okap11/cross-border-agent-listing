# cross-border-agent-listing

> Local-first AI listing workspace for Ozon & Shein Choice.
> 本地优先的 Ozon / Shein Choice 跨境 Listing 智能工作台。

面向跨境卖家，统一管理商品源数据，一键映射导出多平台上架模板，并基于本地大模型（Ollama）或阿里云百炼（DashScope）智能生成 Listing 文案、分析竞品评论。**所有数据默认保存在浏览器本地，敏感商品信息不上传任何第三方服务器。**

## 🖥️ 在线 Demo

🔗 **https://okap11.github.io/cross-border-agent-listing/**

无需安装，直接在线体验（纯前端应用，数据保存在浏览器本地）。

## ✨ Features

- ✅ **统一商品管理**：录入统一源商品数据，IndexedDB 本地持久化
- ✅ **多平台字段映射**：一键将源数据映射导出为 Ozon / Shein Choice 上架 CSV 模板
- ✅ **AI Listing 生成**：接入 Ollama 本地大模型 / 阿里云百炼，SSE 流式输出多平台标题、五点描述、关键词
- ✅ **竞品评论 RAG 分析**：导入评论文件，本地建索引检索，自动挖掘卖点与差评痛点
- ✅ **Local-First**：全部数据保存在浏览器 IndexedDB，无后端、可离线
- ✅ 纯前端静态页面，可部署到 GitHub Pages / Vercel 等任意静态托管

## 📋 上架字段依据

「新增商品」的字段与 Ozon / SHEIN 平台映射，基于**官方资料调研**整理，而非臆造：

- **Ozon**：参考 [Ozon Seller API 商品上传（POST /v2/product/import）](https://docs.ozon.com/global/en/api/via-api/) 与卖家后台商品卡片要求。核心字段：货号 `offer_id`、商品名称 `name`、品牌 `vendor`、描述、类目 `category_id`、价格、划线价 `old_price`、增值税 `vat`、包装重量与尺寸（长宽高 mm）、图片（1-15 张）、类目特性 `attributes`、变体特征（颜色/尺码），部分类目需商品海关编码。
- **SHEIN**：参考 [SHEIN 开放平台商品发布接口（SPU/SKC/SKU 三层）](https://open.sheincorp.cn/zh/documents/apidoc/detail/3001898) 与商品发布字段规范。核心字段：货号 `supplier_code`、标题（默认语种 + 字符数限制）、描述、末级类目 `category_id`、品牌 `brand_code`、主销售属性=颜色（SKC）、次销售属性=尺码（SKU）、供货价 `cost_info`（含币种）、建议零售价、最小备货数量、图片（主图/细节图 1340×1785 或 1:1 900-2200px，详情图 3:4 >900px，≤3MB）、尺码表、包装类型、商家条码等。

统一源商品模型分为 **6 组**（基础信息 / 价格 / 物流与包装 / 视觉 / 变体与属性 / 库存与合规），通过映射层导出为对应平台上架模板，必填差异已在映射中标注。

## 🛠 Tech Stack

- 框架：Vue 3（`<script setup>`）+ Vite
- UI：Ant Design Vue 4 + @ant-design/icons-vue
- 状态：Pinia
- 路由：Vue Router 4（hash 模式，适配静态部署）
- 本地存储：localforage（IndexedDB）
- 表格处理：xlsx
- LLM：Ollama（SSE 流式）/ 阿里云百炼 DashScope（OpenAI 兼容），可切换
- 向量检索：本地 TF 检索（可替换为 embedding + sqlite-vss wasm）
- 代码规范：ESLint + Prettier

## 🚀 Quick Start

### 1. 启动 Ollama（AI 功能可选）

```bash
ollama pull qwen2:7b
ollama serve
```

> 开发环境下前端通过 Vite 代理访问 `http://127.0.0.1:11434`，无需额外跨域配置。未启动 Ollama 时，商品管理与字段映射功能仍可正常使用。

### 1b. 使用阿里云百炼（可选，替代 Ollama）

在应用内「**模型设置**」页切换到「阿里云百炼」并填写：

| 配置项 | 说明 |
|---|---|
| API Key | 在 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 获取，仅保存在浏览器本地 |
| 模型 | 常用 `qwen-plus` / `qwen-max` / `qwen-turbo` / `qwen-flash` |
| Base URL | 默认北京地域 `https://dashscope.aliyuncs.com`，其他地域替换为对应接入域名 |

> **开发环境**：Vite 已将 `/dashscope` 代理到百炼，无跨域问题。
> **生产环境**（GitHub Pages 等纯静态）：浏览器直连百炼受跨域限制，需自行配置同源代理（如 Vercel Functions / 云函数）。

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
│   │   ├── ollama.js         # Ollama 接口封装（SSE 流式、模型列表、健康检查）
│   │   ├── dashscope.js      # 阿里云百炼（OpenAI 兼容）接口封装
│   │   └── llm.js            # 统一 LLM 适配层（按配置路由到 Ollama / 百炼）
│   ├── assets/
│   ├── components/           # 通用 / 业务组件
│   ├── router/index.js       # 路由配置（懒加载）
│   ├── stores/
│   │   ├── product.js        # 商品 store
│   │   ├── rag.js            # 竞品评论 RAG store
│   │   └── settings.js       # LLM 后端配置 store
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
│   │   ├── RagAnalysis.vue   # 竞品评论分析
│   │   └── ModelSettings.vue # 模型设置（Ollama / 百炼）
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── vite.config.js            # Vite + /ollama、/dashscope 代理配置
├── eslint.config.js
├── .prettierrc.json
└── package.json
```

## 📌 Roadmap

- **v0.1（当前 MVP）**：商品管理、字段映射导出、AI Listing 流式生成、基础评论 RAG
- **v0.2（部分完成）**：✅ LLM 多后端适配（Ollama / 阿里百炼）；待做：语义检索升级、生成结果结构化、Prompt 可编辑、xlsx 导入、数据备份
- v0.3：图片压缩 / 水印 / 抠图、AI 主图生成
- v0.4：MCP Skill 导出、Agent 批量任务
- v0.5：店铺数据看板、库存预警
- v0.6：浏览器扩展版
- v0.7：AI 选品助手

> 完整的功能规划（优先级、验收标准、风险）见 [docs/roadmap.md](docs/roadmap.md)

## ⚠️ Notice

本项目用于个人学习与自用，请勿用于商业用途。使用前请遵守各跨境电商平台的使用条款。
