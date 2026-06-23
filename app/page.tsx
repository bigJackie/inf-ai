import { Sidebar } from '@/components/layout/Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'

export default function Home() {
  return (
    // 整体两栏布局：左侧边栏 + 右侧聊天区
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  )
}
