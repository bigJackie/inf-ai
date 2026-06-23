// 文件解析 → 切分为文本块 每块 500 字符，相邻块重叠 50 字符（保证语义连贯）
const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

export interface TextChunk {
  content: string
  index: number
}

// 滑动窗口切分
function splitIntoChunks(text: string): TextChunk[] {
  const chunks: TextChunk[] = []
  let start = 0
  let index = 0

  // 预处理：合并多余空白
  const cleaned = text.replace(/\s+/g, ' ').trim()

  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length)
    const content = cleaned.slice(start, end).trim()

    if (content.length > 20) {
      // 过滤过短的块
      chunks.push({ content, index })
      index++
    }

    start += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { extractText } = await import('unpdf')
  const { text } = await extractText(new Uint8Array(buffer))
  return text.join('\n')
}

export async function parseFile(buffer: Buffer, mimeType: string): Promise<TextChunk[]> {
  let text = ''

  if (mimeType === 'application/pdf') {
    text = await parsePdf(buffer)
  } else if (mimeType.startsWith('text/')) {
    text = buffer.toString('utf-8')
  } else {
    throw new Error(`暂不支持的文件类型: ${mimeType}`)
  }

  if (!text.trim()) {
    throw new Error('文件内容为空')
  }

  return splitIntoChunks(text)
}
