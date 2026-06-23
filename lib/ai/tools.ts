import { tool } from 'ai'
import { z } from 'zod'
import { create, all } from 'mathjs'
import { tavily } from '@tavily/core'
import CodeInterpreter from '@e2b/code-interpreter'

const math = create(all)

// 先用城市名查经纬度（geocoding），再查天气
async function fetchWeather(city: string) {
  // Step 1: 城市名 → 经纬度
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
  )
  const geoData = await geoRes.json()

  if (!geoData.results?.length) {
    return { error: `找不到城市：${city}` }
  }

  const { latitude, longitude, name, country } = geoData.results[0]

  // Step 2: 经纬度 → 天气
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&wind_speed_unit=kmh&timezone=auto`,
  )
  const weatherData = await weatherRes.json()
  const c = weatherData.current

  return {
    city: `${name}，${country}`,
    temperature: `${c.temperature_2m}°C`,
    condition: wmoCodeToDescription(c.weather_code), // WMO 天气代码转中文描述
    humidity: `${c.relative_humidity_2m}%`,
    windSpeed: `${c.wind_speed_10m} km/h`,
  }
}

// WMO 气象代码 → 中文
function wmoCodeToDescription(code: number): string {
  const map: Record<number, string> = {
    0: '晴天',
    1: '基本晴朗',
    2: '部分多云',
    3: '阴天',
    45: '雾',
    48: '冻雾',
    51: '小毛毛雨',
    53: '中毛毛雨',
    55: '大毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '阵雨',
    81: '中阵雨',
    82: '强阵雨',
    95: '雷暴',
    96: '雷暴伴小冰雹',
    99: '雷暴伴大冰雹',
  }
  return map[code] ?? `天气代码 ${code}`
}

async function fetchSearch(query: string, apiKey?: string) {
  const client = tavily({ apiKey: apiKey || process.env.TAVILY_API_KEY! })
  const res = await client.search(query, { maxResults: 3, searchDepth: 'basic' })
  return {
    query,
    results: res.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content.slice(0, 200),
    })),
  }
}

async function fetchReadUrl(url: string) {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: 'text/plain' },
  })
  if (!res.ok) return { error: `无法读取页面：${res.status}` }
  const text = await res.text()
  return {
    url,
    // 截取前 3000 字，避免超出 context window
    content: text.slice(0, 3000),
    truncated: text.length > 3000,
  }
}

async function fetchRunCode(code: string, apiKey?: string) {
  const sandbox = await CodeInterpreter.create({
    apiKey: apiKey || process.env.E2B_API_KEY!,
  })
  try {
    const result = await sandbox.runCode(code)
    return {
      stdout: result.logs.stdout.join('\n'),
      stderr: result.logs.stderr.join('\n'),
      error: result.error ? `${result.error.name}: ${result.error.value}` : null,
    }
  } finally {
    await sandbox.kill()
  }
}

// 每个工具：description 告诉模型"何时用"，parameters 定义入参，execute 是实际执行逻辑
export function getAgentTools(keys?: { tavilyApiKey?: string; e2bApiKey?: string }) {
  return {
    getWeather: tool({
      description: '获取指定城市的实时天气，包括温度、天气状况、湿度、风速',
      inputSchema: z.object({
        city: z.string().describe('城市名称，中英文均可，如：北京、Shanghai'),
      }),
      execute: async ({ city }) => {
        return await fetchWeather(city)
      },
    }),

    calculate: tool({
      description: '计算数学表达式，支持加减乘除、幂运算、三角函数、对数等',
      inputSchema: z.object({
        expression: z.string().describe('合法的数学表达式，如：sqrt(16) + 2^3、sin(pi/2)'),
      }),
      execute: async ({ expression }) => {
        try {
          const result = math.evaluate(expression)
          return { expression, result: String(result) }
        } catch {
          return { expression, result: '表达式无效，请检查语法' }
        }
      },
    }),

    searchWeb: tool({
      description: '搜索互联网获取最新信息，适合查询实时新闻、最新数据、不确定的事实',
      inputSchema: z.object({
        query: z.string().describe('搜索关键词，建议简洁精准'),
      }),
      execute: async ({ query }) => fetchSearch(query, keys?.tavilyApiKey),
    }),

    // 获取当前时间
    getCurrentTime: tool({
      description: '获取当前的日期和时间，当用户问"今天是几号"、"现在几点"、"今年是哪年"时使用',
      inputSchema: z.object({
        timezone: z.string().optional().describe('时区，如 Asia/Shanghai，默认使用服务器时区'),
      }),
      execute: async ({ timezone }) => {
        const now = new Date()
        const formatted = new Intl.DateTimeFormat('zh-CN', {
          timeZone: timezone ?? 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long',
          hour12: false,
        }).format(now)
        return {
          datetime: formatted,
          timestamp: now.toISOString(),
          timezone: timezone ?? 'Asia/Shanghai',
        }
      },
    }),

    // 读取网页内容
    readUrl: tool({
      description: '读取指定网页的文本内容，适合在搜索后精读某个页面、获取文档详情',
      inputSchema: z.object({
        url: z.string().url().describe('要读取的网页 URL，必须是完整 URL，如 https://example.com'),
      }),
      execute: async ({ url }) => fetchReadUrl(url),
    }),

    // 执行 Python 代码
    runCode: tool({
      description: '在沙箱中执行代码，适合数据分析、数学计算、生成图表、处理数据等任务',
      inputSchema: z.object({
        code: z.string().describe('要执行的代码'),
        description: z.string().optional().describe('简述这段代码要做什么'),
      }),
      execute: async ({ code }) => fetchRunCode(code, keys?.e2bApiKey),
    }),
  }
}
