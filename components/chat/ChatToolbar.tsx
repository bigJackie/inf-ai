'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Paperclip, Settings2, MessageCircle, Bot, FileText, X, Loader2 } from 'lucide-react'
import { SessionSettingsSheet } from '@/components/settings/SessionSettingsSheet'

// 会话模式：普通对话 or Agent 多步推理
export type ChatMode = 'chat' | 'agent'

// 已上传文档的类型
export interface UploadedDoc {
  documentId: string
  name: string
  chunkCount: number
}

interface Props {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadedDocs: UploadedDoc[]
  onDocRemove: (id: string) => void
}

export function ChatToolbar({
  mode,
  onModeChange,
  onFileSelect,
  isUploading,
  uploadedDocs,
  onDocRemove,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sessionSettingsOpen, setSessionSettingsOpen] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-1 pb-1">
        {/* 模式切换：Chat / Agent */}
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === 'chat' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
                onClick={() => onModeChange('chat')}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                对话
              </Button>
            </TooltipTrigger>
            <TooltipContent>普通对话模式</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === 'agent' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
                onClick={() => onModeChange('agent')}
              >
                <Bot className="h-3.5 w-3.5" />
                Agent
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  Beta
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>多步推理 + 工具调用</TooltipContent>
          </Tooltip>
        </div>

        <div className="bg-border mx-1 h-4 w-px" />

        {/* 上传按钮 + 已上传列表 Popover */}
        <div className="flex items-center gap-0.5">
          {/* 上传按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 cursor-pointer gap-1.5 px-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5" />
                )}
                {isUploading ? '上传中...' : '上传文件'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>支持 .txt .md .pdf</TooltipContent>
          </Tooltip>

          {/* 已上传文档数量角标 + Popover 列表 */}
          {uploadedDocs.length > 0 && (
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 cursor-pointer gap-1 px-1.5 text-xs text-blue-500 hover:text-blue-600"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {uploadedDocs.length}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>查看已上传文档</TooltipContent>
              </Tooltip>

              <PopoverContent className="w-72 p-2" align="start">
                <p className="text-muted-foreground mb-2 px-1 text-xs font-medium">
                  已上传文档（{uploadedDocs.length}）
                </p>
                <div className="space-y-1">
                  {uploadedDocs.map(doc => (
                    <div
                      key={doc.documentId}
                      className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5"
                    >
                      <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        {/* 文件名超长时截断 */}
                        <p className="truncate text-xs font-medium">{doc.name}</p>
                        <p className="text-muted-foreground text-[10px]">{doc.chunkCount} 个片段</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-5 w-5 shrink-0"
                            onClick={() => onDocRemove(doc.documentId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>从知识库移除</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              onFileSelect(file)
              e.target.value = ''
            }
          }}
        />

        {/* 弹性空白，把后面的按钮推到右边 */}
        <div className="flex-1" />

        {/* 会话配置（Prompt / 参数）*/}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-7 w-7 cursor-pointer"
              onClick={() => setSessionSettingsOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>会话配置</TooltipContent>
        </Tooltip>

        <SessionSettingsSheet open={sessionSettingsOpen} onOpenChange={setSessionSettingsOpen} />
      </div>
    </TooltipProvider>
  )
}
