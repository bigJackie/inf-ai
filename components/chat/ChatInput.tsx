'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SendHorizontal, Square } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ChatToolbar, ChatMode, UploadedDoc } from './ChatToolbar'
import React from 'react'

interface Props {
  input: string
  isLoading: boolean
  isUploading: boolean
  mode: ChatMode
  uploadedDocs: UploadedDoc[]
  onInputChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  onModeChange: (mode: ChatMode) => void
  onFileSelect: (file: File) => void
  onDocRemove: (id: string) => void
}

export function ChatInput({
  input,
  isLoading,
  isUploading,
  mode,
  uploadedDocs,
  onInputChange,
  onSubmit,
  onStop,
  onModeChange,
  onFileSelect,
  onDocRemove,
}: Props) {
  // Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="bg-background border-t px-4 py-3">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {/* 工具栏 */}
        <ChatToolbar
          mode={mode}
          onModeChange={onModeChange}
          onFileSelect={onFileSelect}
          isUploading={isUploading}
          uploadedDocs={uploadedDocs}
          onDocRemove={onDocRemove}
        />

        {/* 输入区域 */}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isUploading ? '文件上传中，请稍候...' : '发送消息... （Enter 发送，Shift+Enter 换行）'
            }
            rows={1}
            disabled={isUploading}
            className="max-h-50 min-h-10 resize-none"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {isLoading ? (
                  <Button variant="outline" size="icon" onClick={onStop}>
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="icon" onClick={onSubmit} disabled={!input.trim() || isUploading}>
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent>{isLoading ? '停止' : '发送'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
