import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { createModel } from '@/lib/ai/model'
import { AGENT_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { retrieveRelevantChunks, formatContext } from '@/lib/rag/retriever'
import { getAgentTools } from '@/lib/ai/tools'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    tavilyApiKey,
    e2bApiKey,
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

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')

  const userText =
    lastUserMessage?.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { type: 'text'; text: string }).text)
      .join('') ?? ''

  let systemPrompt = systemPromptOverride ?? AGENT_SYSTEM_PROMPT

  if (userText) {
    const chunks = await retrieveRelevantChunks(userText, sessionId ?? null)
    const context = formatContext(chunks)

    if (context) {
      systemPrompt = `${systemPrompt}

## 参考文档
以下是与用户问题相关的文档内容，请优先基于这些内容回答，如果文档内容不足以回答问题，再使用你自身的知识：

${context}`
    }
  }

  const aiModel = createModel({
    apiKey: siliconflowApiKey || process.env.OPENAI_API_KEY!,
    baseURL: siliconflowBaseURL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL!,
    model: model ?? 'deepseek-ai/DeepSeek-V3',
  })

  const result = streamText({
    model: aiModel,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: temperature ?? 0.7,
    tools: getAgentTools({ tavilyApiKey, e2bApiKey }),
    stopWhen: stepCountIs(5),
    abortSignal: signal,
  })

  return result.toUIMessageStreamResponse()
}
