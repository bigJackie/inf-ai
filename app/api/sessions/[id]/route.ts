import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 获取单个会话（含消息 + 关联文档）
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      systemPrompt: true,
      model: true,
      messages: {
        select: { id: true, role: true, parts: true },
        orderBy: { createdAt: 'asc' },
      },
      documents: {
        select: { id: true, name: true },
      },
    },
  })

  if (!session) {
    return NextResponse.json({ error: '会话不存在' }, { status: 404 })
  }

  return NextResponse.json(session)
}

// 删除会话（级联删消息 + 文档 + Chunk）
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.session.delete({ where: { id } })
  return NextResponse.json({ message: '删除成功' })
}

// 更新会话标题
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title, systemPrompt, model } = await req.json()
  const session = await prisma.session.update({
    where: { id },
    data: { title, systemPrompt, model },
    select: {
      id: true,
      title: true,
      systemPrompt: true,
      model: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return NextResponse.json(session)
}
