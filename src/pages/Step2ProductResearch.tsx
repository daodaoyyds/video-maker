import { useState, useCallback } from 'react'
import { Card, Button, Space, Spin, message, Tag, Radio, Row, Col, Typography, Progress, Descriptions, Image, Divider } from 'antd'
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
    return `请根据以下商品信息，提供详细的产品调研报告：

商品名称：${productName}
商品图片：${productImage || '未提供'}

请提供以下信息：
1. 基本信息：规格、参数、价格、适用人群
2. 核心技术：产品采用的技术/成分
3. 核心功效：产品的主要功效
4. 解决痛点：产品解决的用户痛点
5. 产品外观细节：
   - 形态说明（外观描述，如：圆柱形瓶身、方形盒子等）
   - 尺寸比例（如：高度10cm，直径3cm）
   - 主色调（如：香槟金、玫瑰粉、纯白色）
   - 主要文字元素（如：品牌名、产品名、容量标识）
   - 材质质感（如：磨砂玻璃、亮面金属、哑光塑料）
   - 使用场景暗示（如：便携小巧适合随身携带）

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
            // API 调用失败，使用模拟数据
            resolve({ success: true, data: getMockProductInfo() })
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
            // API 调用失败，使用模拟数据
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

  // 模拟产品信息（API失败时使用）
  const getMockProductInfo = (): ProductInfo => ({
    basicInfo: '光感美白精华液，30ml，适用于所有肤质，特别适合干性和混合性肌肤',
    coreTech: '采用光感因子+烟酰胺双重美白技术，配合玻尿酸保湿成分',
    coreBenefits: '提亮肤色、淡化色斑、均匀肤色、深层保湿',
    painPoints: '肤色暗沉、色斑困扰、干燥缺水、妆感不自然',
    formDescription: '圆柱形玻璃瓶身，搭配金色按压泵头设计',
    sizeRatio: '瓶身高度12cm，直径3.5cm，精致小巧',
    mainColors: ['香槟金', '透明玻璃', '白色标签'],
    textElements: ['品牌LOGO', '产品名称', '容量标识', '成分说明'],
    materialTexture: '磨砂玻璃瓶身，金属质感按压泵，光滑细腻',
    usageScenarios: ['日常护肤', '妆前打底', '随身携带', '旅行必备'],
  })

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

  // 获取选中的TA信息
  const selectedTAInfo = taProfiles.find(ta => ta.id === selectedTA)

  return (
    <div>
      <Title level={4} style={{ marginBottom: '24px' }}>
        步骤 2：产品调研与TA画像分析
      </Title>

      {/* 开始调研按钮 */}
      {!productInfo && !loading && (
        <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Text type="secondary">点击下方按钮开始产品调研</Text>
            <Button type="primary" size="large" onClick={handleResearch}>
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
          <Row gutter={[24, 24]}>
            {/* 左侧：产品图片和基本信息 */}
            <Col xs={24} lg={8}>
              <Card title="产品信息" style={{ marginBottom: '24px' }}>
                {productImage && (
                  <Image
                    src={productImage}
                    alt={productName}
                    style={{ width: '100%', marginBottom: '16px', borderRadius: '8px' }}
                  />
                )}
                <Title level={5}>{productName}</Title>
                <Divider />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="核心技术">
                    {productInfo.coreTech || '暂无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="核心功效">
                    {productInfo.coreBenefits || '暂无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决痛点">
                    {productInfo.painPoints || '暂无'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* 右侧：产品外观细节 */}
            <Col xs={24} lg={16}>
              <Card 
                title="📦 产品外观细节" 
                style={{ marginBottom: '24px' }}
                extra={<Tag color="blue">AI分析</Tag>}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Card size="small" title="形态说明">
                      <Text>{productInfo.formDescription || '暂无数据'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small" title="尺寸比例">
                      <Text>{productInfo.sizeRatio || '暂无数据'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small" title="主色调">
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
                  <Col xs={24} sm={12}>
                    <Card size="small" title="材质质感">
                      <Text>{productInfo.materialTexture || '暂无数据'}</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card size="small" title="主要文字元素">
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
                  <Col xs={24} sm={12}>
                    <Card size="small" title="使用场景暗示">
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
            </Col>
          </Row>

          {/* TA画像选择 */}
          <Card title="👥 选择TA画像" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              {taProfiles.map((ta) => (
                <Col xs={24} sm={12} key={ta.id}>
                  <Card
                    hoverable
                    onClick={() => setSelectedTA(ta.id)}
                    style={{
                      borderColor: selectedTA === ta.id ? '#1890ff' : undefined,
                      backgroundColor: selectedTA === ta.id ? '#e6f7ff' : undefined,
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
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card title="🎬 场景规模">
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
              <Card title="📖 情节规模">
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
            <Card title="✅ 已选择配置" style={{ marginBottom: '24px' }} type="inner">
              <Space size="large" wrap>
                <div>
                  <Text type="secondary">TA画像：</Text>
                  <Tag color="blue">{selectedTAInfo.name}</Tag>
                </div>
                <div>
                  <Text type="secondary">场景规模：</Text>
                  <Tag color="green">{sceneScale}</Tag>
                </div>
                <div>
                  <Text type="secondary">情节规模：</Text>
                  <Tag color="purple">{plotScale}</Tag>
                </div>
              </Space>
            </Card>
          )}
        </>
      )}

      {/* 底部导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
        <Space>
          {productInfo && (
            <Button icon={<ReloadOutlined />} onClick={handleResearch}>
              重新调研
            </Button>
          )}
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />} 
            onClick={handleNext}
            disabled={!productInfo || !selectedTA}
          >
            下一步
          </Button>
        </Space>
      </div>
    </div>
  )
}
