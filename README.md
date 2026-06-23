# inf-ai — 智能 Agent 助手

> 面向大厂前端 Agent 赛道的全栈求职作品，融合 **RAG 知识库问答** + **多工具 Agent** + **流式对话** 于一体。

---

## ✨ 功能概览

| 功能 | 描述 |
|------|------|
| 💬 **双模式对话** | 普通 Chat 模式 与 Agent 模式一键切换，后者支持多步工具调用 |
| 🛠️ **Agent 工具集** | 实时天气、网页搜索、网页精读、Python 代码沙箱执行、数学计算、当前时间 |
| 📚 **RAG 知识库** | 上传 PDF / 纯文本文件，自动切片 → 向量化 → pgvector 余弦检索，结果注入 Prompt |
| 🗂️ **多会话管理** | 会话列表持久化到 PostgreSQL，切换会话自动恢复历史消息 + 关联文档 |
| ⚙️ **灵活配置** | 全局 / 会话级双层模型、Temperature、系统提示词覆盖，API Key 前端配置无需重启 |
| 🌗 **亮 / 暗主题** | 基于 `next-themes`，跟随系统或手动切换 |
| ⚡ **流式渲染** | Vercel AI SDK `streamText` + `toUIMessageStreamResponse`，工具调用过程实时可视化 |

---

## 🏗️ 技术栈

### 核心框架

| 层级 | 技术 | 版本 |
|------|------|------|
| 全栈框架 | [Next.js](https://nextjs.org) App Router | 16 |
| 视图层 | React + TypeScript | 19 / 5 |
| AI SDK | [Vercel AI SDK](https://sdk.vercel.ai) (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`) | 6 |
| LLM 接入 | SiliconFlow（兼容 OpenAI 协议），支持 DeepSeek-V3/R1、Qwen2.5-72B、Nex-N2-Pro 等 | — |

### 数据层

| 技术 | 用途 |
|------|------|
| PostgreSQL + [pgvector](https://github.com/pgvector/pgvector) | 关系数据 + 1024 维向量检索 |
| [Prisma 7](https://www.prisma.io) + `@prisma/adapter-pg` | ORM + 原生 SQL 向量写入/查询 |
| `BAAI/bge-m3` Embedding 模型 | 文档与查询的向量化（1024 维）|

### Agent 工具

| 工具 | 技术实现 |
|------|---------|
| 网页搜索 | [Tavily API](https://tavily.com) |
| 网页精读 | [Jina.ai Reader](https://r.jina.ai) |
| 代码执行 | [E2B Code Interpreter](https://e2b.dev)（云端 Python 沙箱）|
| 数学计算 | [mathjs](https://mathjs.org) |
| 天气查询 | Open-Meteo Geocoding + Forecast API（免费无 Key）|

### 前端工程

| 技术 | 用途 |
|------|------|
| [Tailwind CSS v4](https://tailwindcss.com) | 原子化样式 |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | 无障碍组件库 |
| [Zustand v5](https://zustand-demo.pmnd.rs) + `persist` | 轻量全局状态（会话 + 设置，设置持久化到 localStorage）|
| [react-markdown](https://github.com/remarkjs/react-markdown) + react-syntax-highlighter | Markdown 渲染 + 多语言代码高亮 |
| [unpdf](https://github.com/unjs/unpdf) | 浏览器端 PDF 文本提取 |
| [Sonner](https://sonner.emilkowal.ski) | Toast 通知 |

---

## 🔑 技术难点

### 1. RAG 全链路实现

文档从上传到可检索经历四个步骤：

```
文件上传 → parseFile（PDF/txt）→ 滑动窗口切片（500字符/重叠50字符）
       → BAAI/bge-m3 批量 Embedding → Prisma $transaction 原子写入 pgvector
```

检索时将用户问题向量化，用 pgvector `<=>` 余弦距离算子取 top-k 片段，拼入系统提示词，实现文档级上下文注入。

> 关键文件：`lib/rag/parser.ts` · `lib/rag/ingest.ts` · `lib/rag/retriever.ts` · `lib/rag/embedding.ts`

### 2. Agent 多步工具调用

使用 Vercel AI SDK `streamText` 的 `tools` + `stopWhen: stepCountIs(5)` 实现：LLM 每一步可调用工具，结果自动追加到消息流，最多 5 轮后强制结束，防止无限循环。前端通过 `part.type.startsWith('tool-')` 逐步渲染工具调用卡片，包含 `input-streaming → call → output-available` 状态机可视化。

> 关键文件：`app/api/agent/route.ts` · `lib/ai/tools.ts` · `components/agent/ToolInvocationCard.tsx`

### 3. 流式消息与 Transport 复用

`useChat` 的 `DefaultChatTransport` 只初始化一次（`useRef` 存储），通过 `prepareSendMessagesRequest` 回调在运行时读取 `modeRef` / `settingsRef` 动态切换 API 端点和请求体，避免因 state 变化反复重建连接。

> 关键文件：`components/chat/ChatPanel.tsx`

### 4. 会话级 / 全局双层配置覆盖

模型、Temperature、系统提示词均支持「全局默认 → 会话覆盖」两级合并，前端通过 Zustand 管理，后端每次请求从 body 中读取，无需服务端 session，天然无状态可横向扩展。

### 5. pgvector 原生 SQL 写入

Prisma 不支持直接写入 `vector` 类型，通过 `$executeRaw` 拼接 `::vector` 类型转换完成批量插入；读取时用 `$queryRaw` 计算 `1 - (embedding <=> query::vector)` 作为相似度分数返回。

> 关键文件：`lib/rag/ingest.ts` · `lib/rag/retriever.ts` · `prisma/schema.prisma`

### 6. 消息持久化时机

流结束（`status === 'ready'`）后才统一保存整轮消息到 DB，避免流式过程中频繁写库；同时在同一接口返回自动生成的会话标题（取首条用户消息前 20 字），前端收到后同步更新侧边栏，无需额外轮询。

---

## 🚀 快速启动

### 环境要求

- Node.js ≥ 20
- PostgreSQL（需安装 `pgvector` 扩展）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# SiliconFlow 兼容 OpenAI 的 API
OPENAI_API_KEY=your_siliconflow_api_key
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.siliconflow.cn/v1

# PostgreSQL 连接串（需开启 pgvector 扩展）
DATABASE_URL=******localhost:5432/infai

# 可选：Tavily 搜索（Agent 模式网页搜索）
TAVILY_API_KEY=

# 可选：E2B 代码沙箱（Agent 模式代码执行）
E2B_API_KEY=
```

### 3. 初始化数据库

```bash
# 启用 pgvector 扩展（只需一次）
psql $DATABASE_URL -c 'CREATE EXTENSION IF NOT EXISTS vector;'

# 执行迁移
npx prisma migrate deploy
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

---

## 📁 目录结构

```
inf-ai/
├── app/
│   ├── api/
│   │   ├── agent/route.ts      # Agent 流式端点（带工具 + RAG）
│   │   ├── chat/route.ts       # 普通对话流式端点（带 RAG）
│   │   ├── sessions/           # 会话 CRUD
│   │   ├── documents/          # 文档删除
│   │   └── upload/             # 文件上传 + RAG 写入
│   └── page.tsx                # 主页面
├── components/
│   ├── agent/                  # 工具调用可视化卡片
│   ├── chat/                   # 对话 UI（输入框、消息列表、工具栏）
│   ├── layout/                 # 侧边栏（会话列表 + 设置）
│   └── ui/                     # shadcn/ui 组件
├── lib/
│   ├── ai/                     # 模型工厂、工具定义、提示词
│   └── rag/                    # 文件解析、切片、Embedding、检索
├── store/                      # Zustand 状态（会话 + 全局设置）
└── prisma/                     # 数据库 Schema + 迁移
```

---

## 📜 License

[MIT](LICENSE)
