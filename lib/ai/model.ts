import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

// Provider 配置类型，后期从用户设置面板传入
export interface ModelConfig {
  baseURL: string
  apiKey: string
  model: string
}

// 默认配置
export const defaultModelConfig: ModelConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL!,
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL!,
}

// 根据配置创建模型实例
export function createModel(config: ModelConfig = defaultModelConfig) {
  const provider = createOpenAICompatible({
    name: 'siliconflow',
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  })
  return provider(config.model)
}
