import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GlobalSettings {
  model: string
  temperature: number
  systemPrompt: string
  siliconflowApiKey: string
  siliconflowBaseURL: string
  tavilyApiKey: string
  e2bApiKey: string
}

interface SettingsState extends GlobalSettings {
  setModel: (model: string) => void
  setTemperature: (t: number) => void
  setSystemPrompt: (p: string) => void
  setSiliconflowApiKey: (k: string) => void
  setSiliconflowBaseURL: (u: string) => void
  setTavilyApiKey: (k: string) => void
  setE2bApiKey: (k: string) => void
  // 批量保存
  saveSettings: (s: Partial<GlobalSettings>) => void
}

// persist 中间件自动同步到 localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      model: 'nex-agi/Nex-N2-Pro',
      temperature: 0.7,
      systemPrompt:
        '你是一个智能 AI 助理，回答简洁、准确。如果不确定答案，请直接说不知道，不要编造内容。',
      siliconflowApiKey: '',
      siliconflowBaseURL: 'https://api.siliconflow.cn/v1',
      tavilyApiKey: '',
      e2bApiKey: '',

      setModel: model => set({ model }),
      setTemperature: temperature => set({ temperature }),
      setSystemPrompt: systemPrompt => set({ systemPrompt }),
      setSiliconflowApiKey: siliconflowApiKey => set({ siliconflowApiKey }),
      setSiliconflowBaseURL: siliconflowBaseURL => set({ siliconflowBaseURL }),
      setTavilyApiKey: tavilyApiKey => set({ tavilyApiKey }),
      setE2bApiKey: e2bApiKey => set({ e2bApiKey }),
      saveSettings: s => set(s),
    }),
    { name: 'global-settings' }, // localStorage key
  ),
)
