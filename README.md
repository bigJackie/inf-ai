<div align="center">

# Infinite Agent

<div>

[![](https://img.shields.io/badge/license-MIT-violet.svg)](https://champyin.com)

</div>

基于 React 的组件库，融合 **RAG 知识库问答** + **多工具 Agent** + **流式对话** 于一体

</div>

---

## 在线Demo
[Infinite Agent在线Demo](https://jackiewong.top/projects/infai/)

---

## ✨ 功能概览

| 功能                | 描述                                                                   |
|-------------------|----------------------------------------------------------------------|
| 💬 **双模式对话**      | 普通 Chat 模式 与 Agent 模式一键切换，后者支持多步工具调用                                 |
| 🛠️ **Agent 工具集** | 实时天气、网页搜索、网页精读、代码沙箱执行、数学计算、当前时间                                      |
| 📚 **RAG 知识库**    | 上传 PDF / 纯文本文件，自动切片 → 向量化 → pgvector 余弦检索，结果注入 Prompt                |
| 🗂️ **多会话管理**     | 会话列表持久化到 PostgreSQL，切换会话自动恢复历史消息 + 关联文档                              |
| ⚙️ **灵活配置**       | 全局 / 会话级双层模型、Temperature、系统提示词覆盖，API Key 前端配置无需重启                    |
| ⚡ **流式渲染**        | Vercel AI SDK `streamText` + `toUIMessageStreamResponse`，工具调用过程实时可视化 |

---

## 🏗️ 技术栈

### 核心框架

| 层级     | 技术                                                                                          | 版本     |
|--------|---------------------------------------------------------------------------------------------|--------|
| 全栈框架   | [Next.js](https://nextjs.org) App Router                                                    | 16     |
| 视图层    | React + TypeScript                                                                          | 19 / 5 |
| AI SDK | [Vercel AI SDK](https://sdk.vercel.ai) (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`) | 6      |
| LLM 接入 | SiliconFlow（兼容 OpenAI 协议）                                                                   | —      |

### 数据层

| 技术                                                       | 用途                   |
|----------------------------------------------------------|----------------------|
| Supabase + PostgreSQL                                    | 关系数据 + 1024 维向量检索    |
| [Prisma 7](https://www.prisma.io) + `@prisma/adapter-pg` | ORM + 原生 SQL 向量写入/查询 |
| `BAAI/bge-m3` Embedding 模型                               | 文档与查询的向量化（1024 维）    |

### Agent 工具

| 工具   | 技术实现                                          |
|------|-----------------------------------------------|
| 网页搜索 | [Tavily API](https://tavily.com)              |
| 网页精读 | [Jina.ai Reader](https://r.jina.ai)           |
| 代码执行 | [E2B Code Interpreter](https://e2b.dev)（云端沙箱） |
| 数学计算 | [mathjs](https://mathjs.org)                  |
| 天气查询 | Open-Meteo Geocoding + Forecast API（免费无 Key）  |

### 前端工程

| 技术                                                                                      | 用途                                    |
|-----------------------------------------------------------------------------------------|---------------------------------------|
| [Tailwind CSS v4](https://tailwindcss.com)                                              | 原子化样式                                 |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI                                           | 无障碍组件库                                |
| [Zustand v5](https://zustand-demo.pmnd.rs) + `persist`                                  | 轻量全局状态（会话 + 设置，全局设置持久化到 localStorage） |
| [react-markdown](https://github.com/remarkjs/react-markdown) + react-syntax-highlighter | Markdown 渲染 + 多语言代码高亮                 |
| [unpdf](https://github.com/unjs/unpdf)                                                  | 浏览器端 PDF 文本提取                         |
| [Sonner](https://sonner.emilkowal.ski)                                                  | Toast 通知                              |

---

## 🚀 快速启动

### 环境要求

- Node.js ≥ 20

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

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