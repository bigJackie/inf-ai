import { prisma } from '@/lib/prisma'
import { parseFile } from './parser'
import { getEmbeddingBatch } from './embedding'

interface IngestResult {
  documentId: string
  chunkCount: number
}

export async function ingestFile(
  buffer: Buffer,
  name: string,
  mimeType: string,
  size: number,
  sessionId?: string,
): Promise<IngestResult> {
  // 1. 解析文件 → 文本块
  const chunks = await parseFile(buffer, mimeType)

  // 2. 批量生成 embedding
  const texts = chunks.map(c => c.content)
  const embeddings = await getEmbeddingBatch(texts)

  // 3. 写入数据库（事务保证原子性）
  const document = await prisma.$transaction(async tx => {
    // 创建文档记录
    const doc = await tx.document.create({
      data: { name, size, mimeType, ...(sessionId ? { sessionId } : {}) },
    })

    // 批量插入 chunk（pgvector 需要用 $executeRaw 写入向量）
    for (let i = 0; i < chunks.length; i++) {
      const vector = `[${embeddings[i].join(',')}]`
      await tx.$executeRaw`
        INSERT INTO "Chunk" (id, "documentId", content, index, embedding)
        VALUES (
          ${crypto.randomUUID()},
          ${doc.id},
          ${chunks[i].content},
          ${chunks[i].index},
          ${vector}::vector
        )
      `
    }

    return doc
  })

  return { documentId: document.id, chunkCount: chunks.length }
}
