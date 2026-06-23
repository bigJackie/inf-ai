'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlobalSettings, useSettingsStore } from '@/store/settings-store'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MODELS } from '@/lib/ai/models'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSettingsSheet({ open, onOpenChange }: Props) {
  const settings = useSettingsStore()

  // 本地暂存所有字段，点保存才写入 store
  const [local, setLocal] = useState<GlobalSettings>({
    model: settings.model,
    temperature: settings.temperature,
    systemPrompt: settings.systemPrompt,
    siliconflowApiKey: settings.siliconflowApiKey,
    siliconflowBaseURL: settings.siliconflowBaseURL,
    tavilyApiKey: settings.tavilyApiKey,
    e2bApiKey: settings.e2bApiKey,
  })

  // 每次 Sheet 打开时同步 store 最新值
  useEffect(() => {
    if (open) {
      setLocal({
        model: settings.model,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        siliconflowApiKey: settings.siliconflowApiKey,
        siliconflowBaseURL: settings.siliconflowBaseURL,
        tavilyApiKey: settings.tavilyApiKey,
        e2bApiKey: settings.e2bApiKey,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (patch: Partial<GlobalSettings>) => setLocal(prev => ({ ...prev, ...patch }))

  const handleSave = () => {
    settings.saveSettings(local)
    toast.success('全局设置已保存')
    onOpenChange(false)
  }

  const handleReset = () =>
    setLocal({
      model: 'nex-agi/Nex-N2-Pro',
      temperature: 0.7,
      systemPrompt:
        '你是一个智能 AI 助理，回答简洁、准确。如果不确定答案，请直接说不知道，不要编造内容。',
      siliconflowApiKey: '',
      siliconflowBaseURL: 'https://api.siliconflow.cn/v1',
      tavilyApiKey: '',
      e2bApiKey: '',
    })

  // 密码输入框，可切换显示/隐藏
  function ApiKeyInput({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) {
    const [show, setShow] = useState(false)
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? '留空则使用服务器默认配置'}
            className="pr-9 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-100 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>全局设置</SheetTitle>
          <SheetDescription>模型、参数、默认 Prompt，所有会话共享。</SheetDescription>
        </SheetHeader>

        {/* 两个 Tab：模型设置 / API Keys */}
        <Tabs defaultValue="model" className="px-4">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="model" className="flex-1">
              模型
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex-1">
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* ── 模型设置 Tab ── */}
          <TabsContent value="model" className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">模型</Label>
              <div className="grid grid-cols-2 gap-2">
                {MODELS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => set({ model: m.value })}
                    className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                      local.model === m.value
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Temperature</Label>
                <Badge variant="secondary" className="text-xs">
                  {local.temperature.toFixed(1)}
                </Badge>
              </div>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[local.temperature]}
                onValueChange={([v]) => set({ temperature: v })}
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>0 · 精确</span>
                <span>1 · 平衡</span>
                <span>2 · 创意</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">默认 System Prompt</Label>
              <Textarea
                value={local.systemPrompt}
                onChange={e => set({ systemPrompt: e.target.value })}
                placeholder="输入默认系统提示词..."
                className="min-h-30 resize-none text-sm"
              />
              <p className="text-muted-foreground text-[11px]">单个会话可在会话设置中覆盖此值</p>
            </div>
          </TabsContent>

          {/* ── API Keys Tab ── */}
          <TabsContent value="keys" className="space-y-5">
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              留空则使用服务器内置配置。填写后优先使用你自己的 Key，仅存储在本地浏览器中。
            </p>

            <div className="space-y-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                硅基流动
              </p>
              <ApiKeyInput
                label="API Key"
                value={local.siliconflowApiKey}
                onChange={v => set({ siliconflowApiKey: v })}
                placeholder="sk-..."
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Base URL</Label>
                <Input
                  value={local.siliconflowBaseURL}
                  onChange={e => set({ siliconflowBaseURL: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                搜索
              </p>
              <ApiKeyInput
                label="Tavily API Key"
                value={local.tavilyApiKey}
                onChange={v => set({ tavilyApiKey: v })}
                placeholder="tvly-..."
              />
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                代码执行
              </p>
              <ApiKeyInput
                label="E2B API Key"
                value={local.e2bApiKey}
                onChange={v => set({ e2bApiKey: v })}
                placeholder="e2b_..."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <div className="flex gap-2 px-4 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
            恢复默认
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSave}>
            保存
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
