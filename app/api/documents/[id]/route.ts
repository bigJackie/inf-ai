import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.document.delete({
    where: { id },
    // schema 里配了 onDelete: Cascade，删 Document 会自动删关联的 Chunk
  })

  return NextResponse.json({ message: '删除成功' })
}
