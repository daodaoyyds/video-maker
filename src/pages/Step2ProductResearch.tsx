import { useState, useCallback } from 'react'
import { Card, Button, Space, Spin, message, Tag, Radio, Row, Col, Typography, Progress, Image, Divider } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { callCozeAgent, generateSessionId, AGENT_CONFIGS } from '../api/coze'

interface Step2Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text } = Typography

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
  const [, setSessionIds] = useState({
    product: '',
    ta: ''
  })

  // 构建提示词
  const buildProductPrompt = useCallback(() => {
    return `请根据商品名称"${productName}"，搜索并提供详细的产品调研信息。

请严格按照以下JSON格式返回，不要添加任何其他文字说明：

{
  "basicInfo": "产品的规格、参数、价格、适用人群等信息",
  "coreTech": "产品采用的核心技术或成分",
  "coreBenefits": "产品的主要功效和作用",
  "painPoints": "产品解决的用户痛点",
  "formDescription": "产品外观形态描述",
  "sizeRatio": "产品尺寸比例",
  "mainColors": ["颜色1", "颜色2"],
  "textElements": ["文字1", "文字2"],
  "materialTexture": "材质质感",
  "usageScenarios": ["场景1", "场景2"]
}

重要：只返回JSON，不要markdown代码块，不要解释说明。`
  }, [productName])

  const buildTAPrompt = useCallback(() => {
    return `请根据以下商品名称，进行舆情调研并推理TA画像，并以JSON格式返回。

商品名称：${productName}

请提供以下信息，并以JSON格式返回：
{
  "taProfiles": [
    {
      "id": "ta1",
      "name": "TA名称",
      "age": "年龄段",
      "skinType": "肤质/特征",
      "painPoints": ["痛点1", "痛点2"],
      "scenes": ["使用场景1", "使用场景2"],
      "motivation": "消费动机"
    }
  ]
}

请提供4个不同的TA画像，确保返回的是合法的JSON格式，不要包含任何其他文本。`
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
      if (productResult.success && productResult.data) {
        setProductInfo(productResult.data)
        setProgress(50)
        setLoadingText('产品调研完成，正在分析TA画像...')
      } else {
        message.error('产品调研失败，请检查API配置')
      }
      
      // 处理TA画像结果
      if (taResult.success && taResult.data.length > 0) {
        setTaProfiles(taResult.data)
        setProgress(100)
        setLoadingText('TA画像分析完成！')
        message.success('产品调研完成！')
      } else {
        message.error('TA画像调研失败，请检查API配置')
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
            console.log('Product answer chunk received, length:', answer.length, 'Total:', fullAnswer.length)
          },
          onEnd: () => {
            console.log('Product onEnd called, fullAnswer length:', fullAnswer.length)
            console.log('Product fullAnswer preview:', fullAnswer.substring(0, 500))
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
            // API 调用失败，返回错误
            resolve({ success: false, data: null })
          }
        }
      )
    })
  }

  // 调用TA画像调研智能体
  const callTAResearchAgent = async (sessionId: string): Promise<{ success: boolean; data: TAProfile[] }> => {
    return new Promise((resolve) => {
      const fullAnswer = { value: '' }
      
      callCozeAgent(
        AGENT_CONFIGS.taResearch,
        { text: buildTAPrompt(), sessionId },
        {
          onStart: () => {
            setLoadingText('TA画像智能体正在调研...')
          },
          onAnswer: (answer) => {
            fullAnswer.value += answer
            console.log('TA answer chunk received, length:', answer.length, 'Total:', fullAnswer.value.length)
          },
          onEnd: () => {
            console.log('TA onEnd called, fullAnswer length:', fullAnswer.value.length)
            console.log('TA fullAnswer preview:', fullAnswer.value.substring(0, 500))
            // 解析返回的JSON
            try {
              const data = parseTAResponse(fullAnswer.value)
              resolve({ success: true, data })
            } catch (error) {
              console.error('Parse TA response error:', error)
              // 如果解析失败，返回模拟数据
              resolve({ success: true, data: getMockTAProfiles() })
            }
          },
          onError: (error) => {
            console.error('TA agent error:', error)
            // API 调用失败，返回错误
            resolve({ success: false, data: [] })
          }
        }
      )
    })
  }

  // 解析产品调研响应
  const parseProductResponse = (response: string): ProductInfo => {
    // 尝试提取JSON（支持嵌套在文本中的JSON）
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error('JSON parse error:', e)
        console.log('Response content:', response.substring(0, 500))
      }
    }
    // 如果无法解析，返回一个包含原始响应的对象
    return {
      basicInfo: response.substring(0, 200),
      coreTech: '解析失败',
      coreBenefits: '解析失败',
      painPoints: '解析失败',
    }
  }

  // 解析TA画像响应
  const parseTAResponse = (response: string): TAProfile[] => {
    // 尝试提取JSON数组（支持嵌套在文本中的JSON）
    const jsonArrayMatch = response.match(/\[[\s\S]*\]/)
    if (jsonArrayMatch) {
      try {
        const data = JSON.parse(jsonArrayMatch[0])
        if (Array.isArray(data)) {
          // 转换新格式到旧格式
          return data.map((item: any, index: number) => ({
            id: `ta${index + 1}`,
            name: item.ta_name || item.name || '未知',
            age: item.target_audience?.split('，')[0] || item.age || '未知',
            skinType: item.target_audience?.split('，')[1] || item.skinType || '未知',
            painPoints: item.pain_points ? [item.pain_points] : item.painPoints || ['暂无'],
            scenes: item.usage_scenarios ? [item.usage_scenarios] : item.scenes || ['暂无'],
            motivation: item.consumption_motivation || item.motivation || '暂无',
          }))
        }
      } catch (e) {
        console.error('JSON array parse error:', e)
      }
    }
    
    // 尝试提取JSON对象（旧格式）
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0])
        if (data.taProfiles || data.TAProfiles) {
          return data.taProfiles || data.TAProfiles || []
        }
      } catch (e) {
        console.error('JSON object parse error:', e)
        console.log('Response content:', response.substring(0, 500))
      }
    }
    
    // 如果无法解析，返回空数组
    return []
  }

  // 模拟TA数据（仅用于初始化）
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

  // 获取选中的TA信息
  const selectedTAInfo = taProfiles.find(ta => ta.id === selectedTA)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      <Title level={3} style={{ marginBottom: '32px', fontSize: '28px', fontWeight: 600 }}>
        步骤 2：产品调研
      </Title>

      {/* 开始调研按钮 */}
      {!productInfo && !loading && (
        <Card 
          style={{ 
            marginBottom: '32px', 
            textAlign: 'center',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px 0' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>点击下方按钮开始产品调研</Text>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleResearch}
              style={{ 
                minWidth: '160px', 
                minHeight: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              开始调研
            </Button>
          </Space>
        </Card>
      )}

      {/* 加载状态 */}
      {loading && (
        <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Spin size="large" />
            <Progress percent={progress} status="active" />
            <Text>{loadingText}</Text>
          </Space>
        </Card>
      )}

      {/* 产品信息展示 */}
      {productInfo && !loading && (
        <>
          {/* 产品基础信息 - 全宽展示 */}
          <Card 
            title={<span style={{ fontSize: '20px', fontWeight: 600 }}>📱 产品信息</span>} 
            style={{ 
              marginBottom: '32px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={6} lg={5}>
                {productImage && (
                  <Image
                    src={productImage}
                    alt={productName}
                    style={{ 
                      width: '100%', 
                      maxWidth: '180px', 
                      borderRadius: '12px', 
                      display: 'block', 
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
              </Col>
              <Col xs={24} md={18} lg={19}>
                <Title level={4} style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>{productName}</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      title={<span style={{ fontWeight: 600 }}>核心技术</span>} 
                      bordered={false} 
                      style={{ 
                        background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
                        borderRadius: '8px',
                        minHeight: '80px'
                      }}
                    >
                      <Text style={{ fontSize: '14px' }}>{productInfo.coreTech || '暂无'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      title={<span style={{ fontWeight: 600 }}>核心功效</span>} 
                      bordered={false} 
                      style={{ 
                        background: 'linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%)',
                        borderRadius: '8px',
                        minHeight: '80px'
                      }}
                    >
                      <Text style={{ fontSize: '14px' }}>{productInfo.coreBenefits || '暂无'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      title={<span style={{ fontWeight: 600 }}>解决痛点</span>} 
                      bordered={false} 
                      style={{ 
                        background: 'linear-gradient(135deg, #fff2e8 0%, #fff7e6 100%)',
                        borderRadius: '8px',
                        minHeight: '80px'
                      }}
                    >
                      <Text style={{ fontSize: '14px' }}>{productInfo.painPoints || '暂无'}</Text>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* 产品外观细节 - 全宽展示 */}
          <Card 
            title={<span style={{ fontSize: '20px', fontWeight: 600 }}>📦 产品外观细节</span>}
            style={{ 
              marginBottom: '32px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)'
            }}
            extra={<Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>AI分析</Tag>}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>形态说明</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  <Text style={{ fontSize: '14px' }}>{productInfo.formDescription || '暂无数据'}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>尺寸比例</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  <Text style={{ fontSize: '14px' }}>{productInfo.sizeRatio || '暂无数据'}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>主色调</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  {productInfo.mainColors && productInfo.mainColors.length > 0 ? (
                    <Space wrap>
                      {productInfo.mainColors.map((color, index) => (
                        <Tag key={index} color="cyan">{color}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text>暂无数据</Text>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>材质质感</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  <Text style={{ fontSize: '14px' }}>{productInfo.materialTexture || '暂无数据'}</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>主要文字元素</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  {productInfo.textElements && productInfo.textElements.length > 0 ? (
                    <Space wrap>
                      {productInfo.textElements.map((text, index) => (
                        <Tag key={index}>{text}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text>暂无数据</Text>
                  )}
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card 
                  size="small" 
                  title={<span style={{ fontWeight: 600, fontSize: '14px' }}>使用场景暗示</span>} 
                  bordered={false} 
                  style={{ 
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                    minHeight: '100px'
                  }}
                >
                  {productInfo.usageScenarios && productInfo.usageScenarios.length > 0 ? (
                    <Space wrap>
                      {productInfo.usageScenarios.map((scenario, index) => (
                        <Tag key={index} color="purple">{scenario}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text>暂无数据</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Card>

          {/* TA画像选择 */}
          <Card 
            title={<span style={{ fontSize: '20px', fontWeight: 600 }}>👥 选择TA画像</span>} 
            style={{ 
              marginBottom: '32px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Row gutter={[16, 16]}>
              {taProfiles.map((ta) => (
                <Col xs={24} sm={12} key={ta.id}>
                  <Card
                    hoverable
                    onClick={() => setSelectedTA(ta.id)}
                    style={{
                      borderColor: selectedTA === ta.id ? '#1890ff' : '#f0f0f0',
                      backgroundColor: selectedTA === ta.id ? '#e6f7ff' : '#ffffff',
                      borderRadius: '12px',
                      boxShadow: selectedTA === ta.id ? '0 4px 12px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      minHeight: '200px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Title level={5} style={{ margin: 0 }}>{ta.name}</Title>
                      {selectedTA === ta.id && <CheckCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text type="secondary">年龄段：{ta.age}</Text>
                      <Text type="secondary">肤质/特征：{ta.skinType}</Text>
                      <div>
                        <Text type="secondary">痛点：</Text>
                        <Space wrap size="small">
                          {ta.painPoints.map((point, idx) => (
                            <Tag key={idx} color="red">{point}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div>
                        <Text type="secondary">使用场景：</Text>
                        <Space wrap size="small">
                          {ta.scenes.map((scene, idx) => (
                            <Tag key={idx} color="green">{scene}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div>
                        <Text type="secondary">消费动机：</Text>
                        <Text>{ta.motivation}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 场景和情节规模选择 */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col xs={24} lg={12}>
              <Card 
                title={<span style={{ fontSize: '18px', fontWeight: 600 }}>🎬 场景规模</span>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Radio.Group 
                  value={sceneScale} 
                  onChange={(e) => setSceneScale(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {sceneScales.map((scale) => (
                      <Radio key={scale.value} value={scale.value} style={{ width: '100%' }}>
                        <Space direction="vertical" size="small">
                          <Text strong>{scale.label}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{scale.desc}</Text>
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<span style={{ fontSize: '18px', fontWeight: 600 }}>📖 情节规模</span>}
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Radio.Group 
                  value={plotScale} 
                  onChange={(e) => setPlotScale(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {plotScales.map((scale) => (
                      <Radio key={scale.value} value={scale.value} style={{ width: '100%' }}>
                        <Space direction="vertical" size="small">
                          <Text strong>{scale.label}</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>{scale.desc}</Text>
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Card>
            </Col>
          </Row>

          {/* 已选择信息汇总 */}
          {selectedTAInfo && (
            <Card 
              title={<span style={{ fontSize: '16px', fontWeight: 600 }}>✅ 已选择配置</span>} 
              style={{ 
                marginBottom: '32px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)'
              }}
            >
              <Space size="large" wrap>
                <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>TA画像：</Text>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>{selectedTAInfo.name}</Tag>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>场景规模：</Text>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>{sceneScale}</Tag>
                </div>
                <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>情节规模：</Text>
                  <Tag color="purple" style={{ fontSize: '14px', padding: '4px 12px' }}>{plotScale}</Tag>
                </div>
              </Space>
            </Card>
          )}
        </>
      )}

      {/* 底部导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', padding: '0 0 24px 0' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={onPrev}
          size="large"
          style={{ minWidth: '120px', minHeight: '44px' }}
        >
          上一步
        </Button>
        <Space size="middle">
          {productInfo && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResearch}
              size="large"
              style={{ minWidth: '120px', minHeight: '44px' }}
            >
              重新调研
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />} 
            onClick={handleNext}
            disabled={!productInfo || !selectedTA}
            size="large"
            style={{ minWidth: '120px', minHeight: '44px' }}
          >
            下一步
          </Button>
        </Space>
      </div>
    </div>
  )
}
