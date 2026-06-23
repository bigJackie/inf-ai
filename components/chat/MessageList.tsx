'use client'

import { RefObject, useEffect, useRef, useState } from 'react'
import { UIMessage } from 'ai'
import { MessageItem } from './MessageItem'

interface Props {
  messages: UIMessage[]
  isStreaming: boolean
  scrollRef?: RefObject<HTMLDivElement | null>
  onRegenerate?: () => void
}

export function MessageList({
  messages,
  isStreaming,
  scrollRef: externalScrollRef,
  onRegenerate,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = externalScrollRef ?? internalScrollRef
  const [userScrolled, setUserScrolled] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setUserScrolled(!isAtBottom)
  }

  // 新消息到来时自动滚动到底部
  useEffect(() => {
    if (isStreaming && !userScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, userScrolled])

  useEffect(() => {
    if (!isStreaming) {
      setUserScrolled(false)
    }
  }, [isStreaming])

  const lastAssistantIndex = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1)

  if (messages.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        发送消息开始对话
      </div>
    )
  }

  return (
    // 用原生 overflow-y-auto 替代 ScrollArea，触摸板 / 鼠标滚轮均可正常滚动
    <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
        {messages.map((msg, i) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isLast={i === lastAssistantIndex}
            onRegenerate={i === lastAssistantIndex ? onRegenerate : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
