import { prisma } from '@/lib/prisma'
import { getEmbedding } from './embedding'

export interface RetrievedChunk {
  content: string
  documentName: string
  similarity: number
}

// 向量相似度检索，返回最相关的 top-k 文本块
export async function retrieveRelevantChunks(
  query: string,
  sessionId: string | null,
  topK: number = 3,
): Promise<RetrievedChunk[]> {
  // 没有会话或没有上传文档，直接返回空
  if (!sessionId) {
    return []
  }

  // 1. 把用户问题转成向量
  const queryEmbedding = await getEmbedding(query)
  const vectorStr = `[${queryEmbedding.join(',')}]`

  // 2. pgvector 余弦相似度检索
  // <=> 是 pgvector 的余弦距离算子，距离越小越相似，用 1 - distance 转为相似度
  const results = await prisma.$queryRaw<
    Array<{
      id: string
      content: string
      documentName: string
      similarity: number
    }>
  >`
    SELECT
      c.id,
      c.content,
      d.name AS "documentName",
      1 - (c.embedding <=> ${vectorStr}::vector) AS similarity
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE c.embedding IS NOT NULL
      AND d."sessionId" = ${sessionId}
    ORDER BY c.embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `

  return results.map(r => ({
    content: r.content,
    documentName: r.documentName,
    similarity: Number(r.similarity),
  }))
}

// 把检索结果格式化成注入 prompt 的上下文字符串
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map(
      (chunk, i) =>
        `[文档片段 ${i + 1}]（来源：${chunk.documentName}，相似度：${(chunk.similarity * 100).toFixed(1)}%）\n${chunk.content}`,
    )
    .join('\n\n')
}
