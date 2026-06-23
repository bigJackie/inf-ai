'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { DefaultChatTransport, UIMessage } from 'ai'
import { ChatMode } from './ChatToolbar'
import { useSessionStore } from '@/store/session-store'
import { useSettingsStore } from '@/store/settings-store'
import { toast } from 'sonner'

export function ChatPanel() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    addSession,
    updateSessionTitle,
    uploadedDocs,
    setUploadedDocs,
    addUploadedDoc,
    removeUploadedDoc,
    sessionModel,
    sessionSystemPrompt,
    setSessionModel,
    setSessionSystemPrompt,
  } = useSessionStore()

  const {
    model: globalModel,
    temperature,
    systemPrompt: globalSystemPrompt,
    siliconflowApiKey,
    siliconflowBaseURL,
    tavilyApiKey,
    e2bApiKey,
  } = useSettingsStore()

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<ChatMode>('chat')
  const [isUploading, setIsUploading] = useState(false)

  // 滚动容器 ref，切换会话时直接跳到底部
  const scrollRef = useRef<HTMLDivElement>(null)

  const settingsRef = useRef({
    sessionId: currentSessionId,
    model: sessionModel ?? globalModel,
    temperature,
    systemPromptOverride: sessionSystemPrompt ?? globalSystemPrompt,
    siliconflowApiKey: siliconflowApiKey,
    siliconflowBaseURL: siliconflowBaseURL,
    tavilyApiKey: tavilyApiKey,
    e2bApiKey: e2bApiKey,
  })

  settingsRef.current = {
    sessionId: currentSessionId,
    model: sessionModel ?? globalModel,
    temperature,
    systemPromptOverride: sessionSystemPrompt ?? globalSystemPrompt,
    siliconflowApiKey: siliconflowApiKey,
    siliconflowBaseURL: siliconflowBaseURL,
    tavilyApiKey: tavilyApiKey,
    e2bApiKey: e2bApiKey,
  }

  // mode 用 ref 存，transport 闭包里读 ref，不需要重建
  const modeRef = useRef<ChatMode>('chat')
  modeRef.current = mode

  // transport 只建一次，api 通过 ref 动态决定
  const transportRef = useRef<DefaultChatTransport<UIMessage>>(null)
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport({
      api: '/api/chat', // 初始值随便，实际用 fetch override
      prepareSendMessagesRequest: ({ messages, id }) => ({
        api: modeRef.current === 'agent' ? '/api/agent' : '/api/chat',
        body: {
          messages,
          id,
          ...settingsRef.current,
        },
      }),
    })
  }

  const { messages, status, sendMessage, stop, setMessages } = useChat({
    transport: transportRef.current,
    id: currentSessionId ?? 'default',
  })
  const isStreaming = status === 'streaming' || status === 'submitted'

  // 刷新后自动选最新会话（sessions 加载完且当前没有选中时）
  useEffect(() => {
    if (sessions.length > 0 && currentSessionId === null) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId, setCurrentSessionId])

  // 切换会话时加载历史消息 + 关联文档
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([])
      setUploadedDocs([])
      return
    }

    fetch(`/api/sessions/${currentSessionId}`)
      .then(r => r.json())
      .then(data => {
        // 恢复消息
        if (data.messages?.length) {
          setMessages(
            data.messages.map((m: { id: string; role: string; parts: UIMessage['parts'] }) => ({
              id: m.id,
              role: m.role,
              parts: m.parts,
            })),
          )
        } else {
          setMessages([])
        }
        // 恢复文档列表
        if (data.documents?.length) {
          setUploadedDocs(
            data.documents.map((d: { id: string; name: string }) => ({
              documentId: d.id,
              name: d.name,
              chunkCount: 0, // 详情不展示 chunk 数
            })),
          )
        } else {
          setUploadedDocs([])
        }

        // 恢复会话级设置
        setSessionSystemPrompt(data.systemPrompt ?? null)
        setSessionModel(data.model ?? null)

        // 消息加载完直接跳到底部（非滚动动画）
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      })
      .catch(() => toast.error('加载会话失败'))
  }, [currentSessionId, setMessages, setUploadedDocs])

  // 流式结束后保存消息到 DB
  useEffect(() => {
    if (status !== 'ready' || !currentSessionId || messages.length === 0) return

    fetch(`/api/sessions/${currentSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
      .then(r => r.json())
      .then(data => {
        // 同步更新侧边栏标题
        if (data.title) updateSessionTitle(currentSessionId, data.title)
      })
      .catch(() => {}) // 静默失败，不打扰用户
  }, [status, currentSessionId, messages, updateSessionTitle])

  const abortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) {
      return
    }

    if (!currentSessionId) {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const session = await res.json()
      addSession(session)
      setCurrentSessionId(session.id)
    }

    void sendMessage({ text: input })
    setInput('')

    // 60s 后自动 stop
    if (abortTimerRef.current) clearTimeout(abortTimerRef.current)
    abortTimerRef.current = setTimeout(
      () => {
        stop()
        toast.error('请求超时，已自动中断')
      },
      modeRef.current === 'chat' ? 20_000 : 60_000,
    )
  }

  // 流结束时清掉计时器
  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      if (abortTimerRef.current) {
        clearTimeout(abortTimerRef.current)
        abortTimerRef.current = null
      }
    }
  }, [status])

  // 上传接口
  const handleFileSelect = async (file: File) => {
    // 没有会话时自动新建
    let sessionId = currentSessionId
    if (!sessionId) {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const session = await res.json()
      addSession(session)
      setCurrentSessionId(session.id)
      sessionId = session.id
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (sessionId) {
        formData.append('sessionId', sessionId)
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? '上传失败')
      }

      // 上传成功后加入列表
      addUploadedDoc({ documentId: data.documentId, name: file.name, chunkCount: data.chunkCount })

      toast.success(`「${file.name}」上传成功，已切分为 ${data.chunkCount} 个片段`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 从知识库删除文档
  const handleDocRemove = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('删除失败')
      }

      removeUploadedDoc(documentId)
      toast.success('文档已从知识库移除')
    } catch {
      toast.error('删除失败，请重试')
    }
  }

  const handleRegenerate = () => {
    if (isStreaming) return

    // 找最后一条 user 消息的 index
    let lastUserIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i
        break
      }
    }
    if (lastUserIndex === -1) return

    const lastUserMsg = messages[lastUserIndex]
    const userText = lastUserMsg.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { type: 'text'; text: string }).text)
      .join('')

    if (!userText.trim()) return

    // 截到最后一条 user 消息之前，去掉它让 sendMessage 重新发
    setMessages(messages.slice(0, lastUserIndex))
    void sendMessage({ text: userText })
  }

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        scrollRef={scrollRef}
        onRegenerate={handleRegenerate}
      />
      <ChatInput
        input={input}
        isLoading={isStreaming}
        isUploading={isUploading}
        mode={mode}
        uploadedDocs={uploadedDocs}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
        onModeChange={setMode}
        onFileSelect={handleFileSelect}
        onDocRemove={handleDocRemove}
      />
    </div>
  )
}
