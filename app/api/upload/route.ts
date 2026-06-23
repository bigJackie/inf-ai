import { ingestFile } from '@/lib/rag/ingest'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60 // embedding 批量处理需要时间

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const sessionId = formData.get('sessionId') as string | null

  if (!file) {
    return NextResponse.json({ error: '没有收到文件' }, { status: 400 })
  }

  // 限制文件大小 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await ingestFile(
    buffer,
    file.name,
    file.type || 'text/plain',
    file.size,
    sessionId ?? undefined,
  )

  return NextResponse.json({
    message: '上传成功',
    documentId: result.documentId,
    chunkCount: result.chunkCount,
  })
}
