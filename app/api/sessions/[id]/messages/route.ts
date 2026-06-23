import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 保存消息（每次 AI 回复完成后批量更新）
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const { messages } = await req.json()

  // 先删后插，保证幂等（重复保存不会产生重复消息）
  await prisma.message.deleteMany({ where: { sessionId } })
  await prisma.message.createMany({
    data: messages.map((m: { id: string; role: string; parts: unknown }) => ({
      id: m.id,
      sessionId,
      role: m.role,
      parts: m.parts,
    })),
  })

  // 用第一条用户消息的前 20 字更新会话标题
  const firstUserMsg = messages.find(
    (m: { role: string; parts: Array<{ type: string; text?: string }> }) => m.role === 'user',
  )

  let title: string | undefined
  if (firstUserMsg) {
    const text = firstUserMsg.parts
      .filter((p: { type: string }) => p.type === 'text')
      .map((p: { type: string; text?: string }) => p.text ?? '')
      .join('')
      .slice(0, 20)
    if (text) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { title: text, updatedAt: new Date() },
      })
      title = text
    }
  }

  return NextResponse.json({ message: '保存成功', title })
}
