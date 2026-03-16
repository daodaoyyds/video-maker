import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProjectData {
  // Step 1: 基础信息
  productName: string
  productImage: string | null
  videoDuration: number
  aspectRatio: string
  
  // Step 2: 产品调研
  productInfo: ProductInfo | null
  selectedTA: string | null
  sceneScale: string
  plotScale: string
  
  // Step 3: 脚本提案
  scripts: ScriptProposal[]
  selectedScript: ScriptProposal | null
  
  // Step 4-5: 脚本增强
  enhancedScript: EnhancedScript | null
  
  // Step 6: 提示词
  finalPrompt: string
  
  // Step 7: 视频
  videoUrl: string | null
}

export interface ProductInfo {
  basicInfo: string
  coreTech: string
  coreBenefits: string
  painPoints: string
  formDescription?: string
  sizeRatio?: string
  mainColors?: string[]
  textElements?: string[]
  materialTexture?: string
  usageScenarios?: string[]
}

export interface ScriptProposal {
  id: string
  script_id?: string
  title: string
  relationship: string | { dimension: string; specific: string }
  characterSetting?: string
  summary?: string
  outline?: string
  scene?: {
    location: string
    function: string
  }
  character?: {
    age: string
    occupation: string
    appearance: string
    clothing: string
    emotional_state: string
  }
  constraints?: string[]
  rhythm_curve?: string[]
  script_detail?: {
    hook: { time_range: string; description: string }
    pain_point_exposure: { time_range: string; description: string }
    product_solution: { time_range: string; description: string }
    ending: { time_range: string; description: string }
  }
  diversity_tags?: {
    reversal_type: string
    conflict_dimension: string
    pain_exposure_method: string
  }
}

export interface EnhancedScript {
  characterAppearance: string
  expressionChanges: string
  actionDetails: string
  sceneEnvironment: string
  dialogues: string
  style: {
    overall: string
    texture: string
    aesthetic: string
    mood: string
  }
  cinematography: {
    camera: string
    lens: string
    lighting: string
    mood: string
  }
  shots: Shot[]
}

export interface Shot {
  id: number
  duration: string
  description: string
}

interface ProjectStore extends ProjectData {
  setStep1Data: (data: Partial<Pick<ProjectData, 'productName' | 'productImage' | 'videoDuration' | 'aspectRatio'>>) => void
  setStep2Data: (data: Partial<Pick<ProjectData, 'productInfo' | 'selectedTA' | 'sceneScale' | 'plotScale'>>) => void
  setStep3Data: (data: Partial<Pick<ProjectData, 'scripts' | 'selectedScript'>>) => void
  setStep4Data: (data: Partial<Pick<ProjectData, 'enhancedScript'>>) => void
  setStep6Data: (data: Partial<Pick<ProjectData, 'finalPrompt'>>) => void
  setStep7Data: (data: Partial<Pick<ProjectData, 'videoUrl'>>) => void
  reset: () => void
}

const initialState: ProjectData = {
  productName: '',
  productImage: null,
  videoDuration: 15,
  aspectRatio: '9:16',
  productInfo: null,
  selectedTA: null,
  sceneScale: '日常',
  plotScale: '轻度',
  scripts: [],
  selectedScript: null,
  enhancedScript: null,
  finalPrompt: '',
  videoUrl: null,
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setStep1Data: (data) => set((state) => ({ ...state, ...data })),
      setStep2Data: (data) => set((state) => ({ ...state, ...data })),
      setStep3Data: (data) => set((state) => ({ ...state, ...data })),
      setStep4Data: (data) => set((state) => ({ ...state, ...data })),
      setStep6Data: (data) => set((state) => ({ ...state, ...data })),
      setStep7Data: (data) => set((state) => ({ ...state, ...data })),
      reset: () => set(initialState),
    }),
    {
      name: 'video-maker-project',
    }
  )
)
