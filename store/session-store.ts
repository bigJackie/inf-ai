import { create } from 'zustand'
import { UploadedDoc } from '@/components/chat/ChatToolbar'

export interface SessionMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface SessionState {
  // 会话列表（侧边栏展示）
  sessions: SessionMeta[]
  // 当前激活的会话 id
  currentSessionId: string | null
  // 当前会话的上传文档（会话级，随会话加载）
  uploadedDocs: UploadedDoc[]
  // 会话级 prompt 覆盖，null = 使用全局
  sessionSystemPrompt: string | null
  sessionModel: string | null

  setSessions: (sessions: SessionMeta[]) => void
  setCurrentSessionId: (id: string | null) => void
  addSession: (session: SessionMeta) => void
  removeSession: (id: string) => void
  updateSessionTitle: (id: string, title: string) => void
  setUploadedDocs: (docs: UploadedDoc[]) => void
  addUploadedDoc: (doc: UploadedDoc) => void
  removeUploadedDoc: (documentId: string) => void
  setSessionSystemPrompt: (prompt: string | null) => void
  setSessionModel: (model: string | null) => void
}

export const useSessionStore = create<SessionState>()(set => ({
  sessions: [],
  currentSessionId: null,
  uploadedDocs: [],
  sessionSystemPrompt: null,
  sessionModel: null,

  setSessions: sessions => set({ sessions }),
  setCurrentSessionId: id =>
    set({ currentSessionId: id, sessionSystemPrompt: null, sessionModel: null }),
  addSession: session => set(s => ({ sessions: [session, ...s.sessions] })),
  removeSession: id => set(s => ({ sessions: s.sessions.filter(s => s.id !== id) })),
  updateSessionTitle: (id, title) =>
    set(s => ({
      sessions: s.sessions.map(sess => (sess.id === id ? { ...sess, title } : sess)),
    })),
  setUploadedDocs: docs => set({ uploadedDocs: docs }),
  addUploadedDoc: doc => set(s => ({ uploadedDocs: [...s.uploadedDocs, doc] })),
  removeUploadedDoc: documentId =>
    set(s => ({
      uploadedDocs: s.uploadedDocs.filter(d => d.documentId !== documentId),
    })),
  setSessionSystemPrompt: prompt => set({ sessionSystemPrompt: prompt }),
  setSessionModel: model => set({ sessionModel: model }),
}))
