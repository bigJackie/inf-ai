'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, History, Infinity, Plus, Trash2 } from 'lucide-react'
import { GlobalSettingsSheet } from '@/components/settings/GlobalSettingsSheet'
import { useSessionStore } from '@/store/session-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Sidebar() {
  const {
    sessions,
    currentSessionId,
    setSessions,
    setCurrentSessionId,
    addSession,
    removeSession,
  } = useSessionStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // 初始化加载会话列表
  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(setSessions)
      .catch(() => toast.error('加载会话列表失败'))
  }, [setSessions])

  // 新建会话
  const handleNewSession = async () => {
    const res = await fetch('/api/sessions', { method: 'POST' })
    const session = await res.json()
    addSession(session)
    setCurrentSessionId(session.id)
  }

  // 删除会话
  // const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
  //   e.stopPropagation()
  //   await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
  //   removeSession(id)
  //   if (currentSessionId === id) {
  //     setCurrentSessionId(null)
  //   }
  //   toast.success('会话已删除')
  // }

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    await fetch(`/api/sessions/${deleteTargetId}`, { method: 'DELETE' })
    removeSession(deleteTargetId)
    if (currentSessionId === deleteTargetId) setCurrentSessionId(null)
    toast.success('会话已删除')
    setDeleteTargetId(null)
  }

  // 分组逻辑
  const now = new Date()
  const grouped = {
    today: sessions.filter(s => {
      const d = new Date(s.updatedAt)
      return d.toDateString() === now.toDateString()
    }),
    yesterday: sessions.filter(s => {
      const d = new Date(s.updatedAt)
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return d.toDateString() === y.toDateString()
    }),
    earlier: sessions.filter(s => {
      const d = new Date(s.updatedAt)
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return d < y && d.toDateString() !== y.toDateString()
    }),
  }

  const renderGroup = (label: string, items: typeof sessions) => {
    if (!items.length) return null
    return (
      <div key={label}>
        <p className="text-muted-foreground px-2 py-1 text-[11px] font-medium">{label}</p>
        {items.map(session => (
          <div
            key={session.id}
            className={cn(
              'group hover:bg-accent flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5',
              currentSessionId === session.id
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground',
            )}
            onClick={() => setCurrentSessionId(session.id)}
          >
            <span className="flex-1 truncate pr-1 text-xs">{session.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={e => {
                e.stopPropagation()
                setDeleteTargetId(session.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside className="bg-muted/40 flex w-60 flex-col border-r px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Infinity className="h-5 w-5" />
        <span className="font-semibold">Infinite Agent</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          Beta
        </Badge>
      </div>

      <Separator className="my-4" />

      {/* 导航 + 会话列表 */}
      <nav className="flex flex-1 flex-col gap-1 overflow-hidden text-sm">
        {/* 对话 header + 新建按钮 */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>对话</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-5 w-5"
            onClick={handleNewSession}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 分组列表 */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground px-2 py-3 text-center text-xs">暂无对话记录</p>
          ) : (
            <>
              {renderGroup('今天', grouped.today)}
              {renderGroup('昨天', grouped.yesterday)}
              {renderGroup('更早', grouped.earlier)}
            </>
          )}
        </div>
      </nav>

      <Separator className="my-4" />

      {/* 全局设置面板 */}
      <div
        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-sm transition-colors"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-4 w-4" />
        <span>设置</span>
      </div>
      <GlobalSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* 删除二次确认 */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={o => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除对话</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，该对话的所有消息和上传文档将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
