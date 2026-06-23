import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { createModel } from '@/lib/ai/model'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { retrieveRelevantChunks, formatContext } from '@/lib/rag/retriever'

export const runtime = 'nodejs'
export const maxDuration = 20

export async function POST(req: Request) {
  const { signal } = req

  const {
    messages,
    sessionId,
    model,
    temperature,
    systemPromptOverride,
    siliconflowApiKey,
    siliconflowBaseURL,
  }: {
    messages: UIMessage[]
    sessionId?: string
    model?: string
    temperature?: number
    systemPromptOverride?: string
    siliconflowApiKey?: string
    siliconflowBaseURL?: string
    tavilyApiKey?: string
    e2bApiKey?: string
  } = await req.json()

  // 取最后一条用户消息做检索
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

  const userText =
    lastUserMessage?.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { type: 'text'; text: string }).text)
      .join('') ?? ''

  // 检索相关文档片段 会话 prompt 覆盖 > 全局 prompt > 默认
  let systemPrompt = systemPromptOverride ?? SYSTEM_PROMPT
  if (userText) {
    const chunks = await retrieveRelevantChunks(userText, sessionId ?? null)
    const context = formatContext(chunks)

    if (context) {
      // 有相关文档时，把上下文注入系统提示词
      systemPrompt = `${systemPromptOverride}

## 参考文档
以下是与用户问题相关的文档内容，请优先基于这些内容回答，如果文档内容不足以回答问题，再使用你自身的知识：

${context}`
    }
  }

  // model / temperature 由前端传入
  const aiModel = createModel({
    apiKey: siliconflowApiKey || process.env.OPENAI_API_KEY!,
    baseURL: siliconflowBaseURL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL!,
    model: model ?? 'nex-agi/Nex-N2-Pro',
  })

  const result = streamText({
    model: aiModel,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: temperature ?? 0.7,
    abortSignal: signal,
  })

  return result.toUIMessageStreamResponse()
}
