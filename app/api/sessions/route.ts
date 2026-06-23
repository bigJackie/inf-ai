import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// 获取所有会话列表
export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(sessions)
}

// 新建会话
export async function POST() {
  const session = await prisma.session.create({
    data: {},
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(session)
}
