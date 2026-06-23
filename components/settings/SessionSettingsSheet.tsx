'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/store/settings-store'
import { useSessionStore } from '@/store/session-store'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MODELS } from '@/lib/ai/models'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionSettingsSheet({ open, onOpenChange }: Props) {
  const { systemPrompt: globalPrompt, model: globalModel } = useSettingsStore()
  const {
    currentSessionId,
    sessionSystemPrompt,
    setSessionSystemPrompt,
    sessionModel,
    setSessionModel,
  } = useSessionStore()

  // 是否启用会话级覆盖
  const [promptOverride, setPromptOverride] = useState(false)
  const [localPrompt, setLocalPrompt] = useState(sessionSystemPrompt ?? globalPrompt)
  const [localModel, setLocalModel] = useState(globalModel)

  useEffect(() => {
    if (open) {
      setPromptOverride(sessionSystemPrompt !== null)
      setLocalPrompt(sessionSystemPrompt ?? globalPrompt)
      setLocalModel(sessionModel ?? globalModel)
    }
  }, [open, sessionSystemPrompt, sessionModel, globalPrompt, globalModel])

  const handleOverrideToggle = (checked: boolean) => {
    setPromptOverride(checked)
    if (checked) {
      setLocalPrompt(sessionSystemPrompt ?? globalPrompt)
    }
  }

  const handleSave = async () => {
    const newPrompt = promptOverride ? localPrompt : null
    const newModel = localModel !== globalModel ? localModel : null

    setSessionSystemPrompt(newPrompt)
    setSessionModel(newModel)

    if (currentSessionId) {
      await fetch(`./api/sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: newPrompt,
          model: newModel,
        }),
      })
    }

    toast.success('会话设置已保存')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-100 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>会话设置</SheetTitle>
          <SheetDescription>仅影响当前会话，刷新后重置为全局设置。</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          {/* 会话级模型覆盖 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">模型</Label>
              {/* 提示当前是否覆盖了全局 */}
              {localModel !== globalModel && (
                <span className="text-[11px] text-blue-500">已覆盖全局</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setLocalModel(m.value)}
                  className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    localModel === m.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {m.label}
                  {/* 标记全局默认 */}
                  {m.value === globalModel && (
                    <span className="text-muted-foreground ml-1 text-[10px]">全局</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 会话级 System Prompt 覆盖 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">覆盖 System Prompt</Label>
              <Switch checked={promptOverride} onCheckedChange={handleOverrideToggle} />
            </div>
            <Textarea
              value={promptOverride ? localPrompt : globalPrompt}
              onChange={e => setLocalPrompt(e.target.value)}
              disabled={!promptOverride}
              placeholder="输入当前会话的系统提示词..."
              className="min-h-40 resize-none text-sm"
            />
            {!promptOverride && (
              <p className="text-muted-foreground text-[11px]">
                当前使用全局 Prompt，开启开关后可为本会话单独设置
              </p>
            )}
          </div>

          <Button size="sm" className="w-full" onClick={handleSave}>
            保存
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
