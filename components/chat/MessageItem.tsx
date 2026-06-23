'use client'

import { ToolInvocationCard } from '@/components/agent/ToolInvocationCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { UIMessage } from 'ai'
import { Bot, User, Copy, Check, RefreshCw } from 'lucide-react'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'

SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('sql', sql)

interface Props {
  message: UIMessage
  isLast?: boolean
  onRegenerate?: () => void
}

interface ToolPart {
  type: string
  toolCallId: string
  state: 'input-streaming' | 'call' | 'output-available' | 'partial-call' | 'output-error'
  title?: string
  input: Record<string, unknown>
  output?: unknown
  rawInput?: unknown
  errorText?: string
  providerExecuted?: boolean
  preliminary?: boolean
}

// 独立的复制按钮组件，管理自己的"已复制"状态
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    // 2 秒后恢复图标
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'text-muted-foreground hover:text-foreground h-6 w-6 cursor-pointer',
              className,
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? '已复制' : '复制'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function MessageItem({ message, isLast, onRegenerate }: Props) {
  const isUser = message.role === 'user'

  // 提取消息的纯文本内容，用于整条消息的复制
  const plainText = message.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { type: 'text'; text: string }).text)
    .join('\n')

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* 头像 */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* 消息内容：一条消息可能包含多个 parts（文本 + 多次工具调用） */}
      <div className={cn('flex max-w-[75%] flex-col gap-2', isUser && 'items-end')}>
        {message.parts.map((part, i) => {
          // 纯文本
          if (part.type === 'text') {
            if (!part.text.trim()) {
              return null
            }

            return (
              <div key={i} className="group relative">
                <Card
                  className={cn(
                    'px-4 py-2.5 text-sm',
                    isUser && 'bg-primary text-primary-foreground',
                  )}
                >
                  {isUser ? (
                    // 用户消息：纯文本即可
                    <p className="whitespace-pre-wrap">{part.text}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-p:leading-relaxed prose-ul:my-1 prose-li:my-0 prose-headings:mt-2 prose-headings:mb-1 prose-pre:p-0 prose-pre:bg-transparent max-w-none">
                      {' '}
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            const isBlock = !!match
                            const codeText = String(children).replace(/\n$/, '')

                            return isBlock ? (
                              // 代码块：带语言标识时使用高亮渲染
                              <div className="overflow-hidden rounded-md">
                                <div className="flex items-center justify-between bg-zinc-800 px-3 py-1.5">
                                  <span className="text-[11px] text-zinc-400">{match[1]}</span>
                                  <CopyButton text={codeText} />
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ margin: 0, borderRadius: 0 }}
                                >
                                  {codeText}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              // 行内代码：简单样式即可
                              <code
                                className="bg-muted rounded px-1 py-0.5 font-mono text-xs"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </Card>

                {/* 复制 + 重新生成按钮，hover 显示 */}
                <div
                  className={cn(
                    'absolute -bottom-7 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                    isUser ? 'right-0' : 'left-0',
                  )}
                >
                  <CopyButton text={plainText} />
                  {/* 仅最后一条 assistant 消息显示重新生成 */}
                  {!isUser && isLast && onRegenerate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground h-6 w-6 cursor-pointer"
                            onClick={onRegenerate}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>重新生成</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )
          }

          // 工具调用可视化，仅 AI 消息会有这个 part
          if (part.type.startsWith('tool-')) {
            console.log('tool part:', JSON.stringify(part, null, 2))
            const toolPart = part as ToolPart
            return (
              <ToolInvocationCard
                key={toolPart.toolCallId}
                toolName={part.type.replace('tool-', '')}
                state={toolPart.state}
                errorText={toolPart.errorText}
                input={toolPart.input ?? {}}
                output={toolPart.output}
              />
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
