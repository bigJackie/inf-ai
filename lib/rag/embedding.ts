// 调用 embedding 接口，返回向量数组 BAAI/bge-m3 输出 1024 维向量
export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_OPENAI_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'BAAI/bge-m3',
      input: text,
      encoding_format: 'float',
    }),
  })

  if (!res.ok) {
    throw new Error(`Embedding 请求失败: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

// 批量获取 embedding，每批最多 10 条避免超限
export async function getEmbeddingBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  const batchSize = 10

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    // 并发请求同一批次
    const embeddings = await Promise.all(batch.map(getEmbedding))
    results.push(...embeddings)
  }

  return results
}
