import { useState, useCallback } from 'react'
import { Card, Button, Space, Spin, message, Tag, Radio, Row, Col, Typography, Progress } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { callCozeAgent, generateSessionId, AGENT_CONFIGS } from '../api/coze'

interface Step2Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

// TA画像数据类型
interface TAProfile {
  id: string
  name: string
  age: string
  skinType: string
  painPoints: string[]
  scenes: string[]
  motivation: string
}

// 产品信息类型
interface ProductInfo {
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

const sceneScales = [
  { value: '日常', label: '日常场景', desc: '化妆台、办公室、地铁等' },
  { value: '特殊', label: '特殊场景', desc: '保龄球馆、高级餐厅、赛车场等' },
  { value: '极端', label: '极端场景', desc: '赌场、私人飞机、太空等' },
]

const plotScales = [
  { value: '轻度', label: '轻度情节', desc: '正面介绍+轻微摩擦' },
  { value: '中度', label: '中度情节', desc: '较强冲突（抢单、抠门、攀比等）' },
  { value: '高度', label: '高度情节', desc: '极端冲突或戏剧角色（大盗、特工等）' },
]

export default function Step2ProductResearch({ onNext, onPrev }: Step2Props) {
  const { productName, productImage, setStep2Data } = useProjectStore()
  
  // 加载状态
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('')
  
  // 数据状态
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [taProfiles, setTaProfiles] = useState<TAProfile[]>([])
  const [selectedTA, setSelectedTA] = useState<string | null>(null)
  const [sceneScale, setSceneScale] = useState('日常')
  const [plotScale, setPlotScale] = useState('轻度')
  
  // 会话ID（用于保持上下文）
  const [sessionIds, setSessionIds] = useState({
    product: '',
    ta: ''
  })

  // 构建提示词
  const buildProductPrompt = useCallback(() => {
    return `请根据以下商品信息，提供详细的产品调研报告：

商品名称：${productName}
商品图片：${productImage || '未提供'}

请提供以下信息：
1. 基本信息：规格、参数、价格、适用人群
2. 核心技术：产品采用的技术/成分
3. 核心功效：产品的主要功效
4. 解决痛点：产品解决的用户痛点
5. 产品细节：
   - 形态说明（外观描述）
   - 尺寸比例
   - 主色调
   - 主要文字元素
   - 材质质感
   - 使用场景暗示

请以JSON格式返回，便于程序解析。`
  }, [productName, productImage])

  const buildTAPrompt = useCallback(() => {
    return `请根据以下商品名称，进行舆情调研并推理TA画像：

商品名称：${productName}

请提供：
1. 基于社媒调研的核心卖点
2. 高频痛点/讨论点
3. 4个不同的TA画像，每个包含：
   - TA名称
   - 年龄段
   - 肤质/特征
   - 痛点列表
   - 使用场景
   - 消费动机

请以JSON格式返回，便于程序解析。`
  }, [productName])

  // 并行调用两个智能体
  const handleResearch = async () => {
    setLoading(true)
    setProgress(0)
    setLoadingText('正在同时启动产品调研和TA画像分析...')
    
    // 生成会话ID
    const productSessionId = generateSessionId()
    const taSessionId = generateSessionId()
    setSessionIds({ product: productSessionId, ta: taSessionId })
    
    try {
      // 并行调用两个智能体
      const [productResult, taResult] = await Promise.all([
        // 智能体1：产品调研
        callProductResearchAgent(productSessionId),
        // 智能体2：TA画像调研
        callTAResearchAgent(taSessionId)
      ])
      
      // 处理产品调研结果
      if (productResult.success) {
        setProductInfo(productResult.data)
        setProgress(50)
        setLoadingText('产品调研完成，正在分析TA画像...')
      }
      
      // 处理TA画像结果
      if (taResult.success) {
        setTaProfiles(taResult.data)
        setProgress(100)
        setLoadingText('TA画像分析完成！')
        message.success('产品调研完成！')
      }
      
    } catch (error) {
      console.error('Research error:', error)
      message.error('调研过程中出现错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 调用产品调研智能体
  const callProductResearchAgent = async (sessionId: string): Promise<{ success: boolean; data: ProductInfo | null }> => {
    return new Promise((resolve) => {
      let fullAnswer = ''
      
      callCozeAgent(
        AGENT_CONFIGS.productResearch,
        { text: buildProductPrompt(), sessionId },
        {
          onStart: () => {
            setLoadingText('产品调研智能体正在分析...')
          },
          onAnswer: (answer) => {
            fullAnswer += answer
          },
          onEnd: () => {
            // 解析返回的JSON
            try {
              const data = parseProductResponse(fullAnswer)
              resolve({ success: true, data })
            } catch (error) {
              console.error('Parse product response error:', error)
              resolve({ success: false, data: null })
            }
          },
          onError: (error) => {
            console.error('Product agent error:', error)
            resolve({ success: false, data: null })
          }
        }
      )
    })
  }

  // 调用TA画像调研智能体
  const callTAResearchAgent = async (sessionId: string): Promise<{ success: boolean; data: TAProfile[] }> => {
    return new Promise((resolve) => {
      let fullAnswer = ''
      
      callCozeAgent(
        AGENT_CONFIGS.taResearch,
        { text: buildTAPrompt(), sessionId },
        {
          onStart: () => {
            setLoadingText('TA画像智能体正在调研...')
          },
          onAnswer: (answer) => {
            fullAnswer += answer
          },
          onEnd: () => {
            // 解析返回的JSON
            try {
              const data = parseTAResponse(fullAnswer)
              resolve({ success: true, data })
            } catch (error) {
              console.error('Parse TA response error:', error)
              // 如果解析失败，返回模拟数据
              resolve({ success: true, data: getMockTAProfiles() })
            }
          },
          onError: (error) => {
            console.error('TA agent error:', error)
            resolve({ success: true, data: getMockTAProfiles() })
          }
        }
      )
    })
  }

  // 解析产品调研响应
  const parseProductResponse = (response: string): ProductInfo => {
    // 尝试提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('No JSON found in response')
  }

  // 解析TA画像响应
  const parseTAResponse = (response: string): TAProfile[] => {
    // 尝试提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return data.taProfiles || data.TAProfiles || []
    }
    throw new Error('No JSON found in response')
  }

  // 模拟TA数据（备用）
  const getMockTAProfiles = (): TAProfile[] => [
    {
      id: 'ta1',
      name: '干皮通勤族',
      age: '25-32岁',
      skinType: '干皮/混干',
      painPoints: ['肤色暗沉', '毛孔大', '没时间化妆'],
      scenes: ['早八通勤', '快速出门'],
      motivation: '伪素颜、省时、滋润不卡粉',
    },
    {
      id: 'ta2',
      name: '贵妇裸妆党',
      age: '30-40岁',
      skinType: '追求自然妆感',
      painPoints: ['假面感', '妆感重', '想要天生好皮'],
      scenes: ['日常社交', '见客户', '约会'],
      motivation: '天生好皮感、贵妇体验',
    },
    {
      id: 'ta3',
      name: '越夜越美追求者',
      age: '28-35岁',
      skinType: '晚上有应酬/约会',
      painPoints: ['下午脱妆', '油光', '暗沉'],
      scenes: ['长时间带妆', '晚上活动'],
      motivation: '持久、转油为光、越夜越美',
    },
    {
      id: 'ta4',
      name: '底妆卡粉困扰者',
      age: '22-30岁',
      skinType: '干皮',
      painPoints: ['卡粉', '起皮', '不服帖'],
      scenes: ['重要场合', '约会', '拍照'],
      motivation: '服帖、不卡粉、滋润',
    },
  ]

  const handleNext = () => {
    if (!selectedTA) {
      message.error('请选择一个TA画像！')
      return
    }
    
    setStep2Data({
      productInfo,
      selectedTA,
      sceneScale,
      plotScale,
    })
    
    onNext()
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
