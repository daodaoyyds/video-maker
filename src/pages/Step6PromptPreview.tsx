import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Space, Typography, Spin, message, Tabs } from 'antd'
import { ArrowLeftOutlined, CopyOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { callCozeAgent, generateSessionId, AGENT_CONFIGS } from '../api/coze'

interface Step6Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text } = Typography
const { TabPane } = Tabs

export default function Step6PromptPreview({ onNext, onPrev }: Step6Props) {
  const { 
    productName,
    productInfo,
    selectedScript,
    sceneScale,
    plotScale,
    setStep6Data,
  } = useProjectStore()

  const [loading, setLoading] = useState(false)
  const [scriptContent, setScriptContent] = useState('')
  const [productDetails, setProductDetails] = useState('')

  // 构建提示词
  const buildPrompt = useCallback(() => {
    const scriptData = selectedScript ? JSON.stringify(selectedScript, null, 2) : '暂无脚本'
    
    return `请根据以下脚本信息，生成完整的剧情脚本内容：

【商品名称】
${productName}

【选中的脚本】
${scriptData}

【场景规模】
${sceneScale}

【情节规模】
${plotScale}

请生成完整的剧情脚本，包含详细的分镜描述、台词、动作等，以 Markdown 格式返回。`
  }, [productName, selectedScript, sceneScale, plotScale])

  // 生成产品详情 Markdown - 只包含外观相关字段
  const generateProductDetails = useCallback(() => {
    if (!productInfo) return '暂无产品信息'
    
    return `## 产品外观

### 形态说明
${productInfo.formDescription || '暂无'}

### 尺寸比例
${productInfo.sizeRatio || '暂无'}

### 主色调
${productInfo.mainColors?.join('、') || '暂无'}

### 主要文字元素
${productInfo.textElements?.join('、') || '暂无'}

### 材质质感
${productInfo.materialTexture || '暂无'}

### 使用场景
${productInfo.usageScenarios?.join('、') || '暂无'}
`
  }, [productInfo])

  // 固定参数
  const fixedParams = `## 拍摄参数

- **视频时长**: 15秒
- **画面比例**: 9:16 竖屏
- **场景规模**: ${sceneScale}
- **情节规模**: ${plotScale}

## 技术要求

- 分辨率: 1080x1920
- 帧率: 30fps
- 格式: MP4
- 编码: H.264
`

  // 获取完整提示词
  const getFullPrompt = useCallback(() => {
    return `# 剧情脚本

${scriptContent}

---

# 产品细节

${productDetails}

---

# 固定参数

${fixedParams}
`
  }, [scriptContent, productDetails, fixedParams])

  // 保存 finalPrompt 到 store
  const saveFinalPrompt = useCallback(() => {
    const fullPrompt = getFullPrompt()
    setStep6Data({ finalPrompt: fullPrompt })
  }, [getFullPrompt, setStep6Data])

  // 调用智能体生成剧情脚本
  const generateScript = async () => {
    setLoading(true)
    const sessionId = generateSessionId()
    
    try {
      let fullAnswer = ''
      
      await callCozeAgent(
        AGENT_CONFIGS.scriptGeneration,
        { text: buildPrompt(), sessionId },
        {
          onStart: () => {
            message.loading('正在生成剧情脚本...', 0)
          },
          onAnswer: (answer) => {
            fullAnswer += answer
          },
          onEnd: () => {
            message.destroy()
            setScriptContent(fullAnswer)
            message.success('剧情脚本生成完成！')
          },
          onError: (error) => {
            message.destroy()
            console.error('Script generation error:', error)
            message.error('脚本生成失败')
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // 组件加载时自动生成脚本
  useEffect(() => {
    if (!scriptContent) {
      generateScript()
    }
    // 生成产品详情
    setProductDetails(generateProductDetails())
  }, [])

  // 当内容变化时，自动保存到 store
  useEffect(() => {
    if (scriptContent && productDetails) {
      saveFinalPrompt()
    }
  }, [scriptContent, productDetails, saveFinalPrompt])

  // 复制完整提示词
  const handleCopyPrompt = () => {
    const fullPrompt = getFullPrompt()
    navigator.clipboard.writeText(fullPrompt).then(() => {
      message.success('提示词已复制到剪贴板！')
    })
  }

  // 进入下一步（视频生成）
  const handleNext = () => {
    // 确保保存最新的提示词
    saveFinalPrompt()
    onNext()
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      <Title level={3} style={{ marginBottom: '32px', fontSize: '28px', fontWeight: 600 }}>
        步骤 4：提示词预览
      </Title>

      {/* 加载状态 */}
      {loading && (
        <Card style={{ marginBottom: '24px', textAlign: 'center', borderRadius: '12px' }}>
          <Spin size="large" />
          <Text style={{ marginTop: '16px', display: 'block' }}>正在生成剧情脚本...</Text>
        </Card>
      )}

      {/* 三个部分 */}
      {!loading && (
        <Tabs defaultActiveKey="1" type="card" style={{ marginBottom: '24px' }}>
          {/* 第一部分：剧情脚本 */}
          <TabPane tab="📖 剧情脚本" key="1">
            <Card 
              style={{ borderRadius: '12px' }}
              extra={
                <Button 
                  type="primary" 
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(scriptContent)
                    message.success('剧情脚本已复制！')
                  }}
                >
                  复制
                </Button>
              }
            >
              <div 
                contentEditable
                style={{ 
                  minHeight: '400px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}
                onBlur={(e) => setScriptContent(e.currentTarget.innerText)}
              >
                {scriptContent || '暂无内容'}
              </div>
            </Card>
          </TabPane>

          {/* 第二部分：产品外观 */}
          <TabPane tab="📦 产品外观" key="2">
            <Card 
              style={{ borderRadius: '12px' }}
              extra={
                <Button 
                  type="primary" 
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(productDetails)
                    message.success('产品外观已复制！')
                  }}
                >
                  复制
                </Button>
              }
            >
              <div 
                contentEditable
                style={{ 
                  minHeight: '400px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}
                onBlur={(e) => setProductDetails(e.currentTarget.innerText)}
              >
                {productDetails}
              </div>
            </Card>
          </TabPane>

          {/* 第三部分：固定参数 */}
          <TabPane tab="⚙️ 固定参数" key="3">
            <Card style={{ borderRadius: '12px' }}>
              <div style={{ 
                minHeight: '400px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap'
              }}>
                {fixedParams}
              </div>
            </Card>
          </TabPane>
        </Tabs>
      )}

      {/* 底部按钮 */}
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
          <Button 
            type="primary" 
            icon={<CopyOutlined />}
            onClick={handleCopyPrompt}
            size="large"
            style={{ minWidth: '140px', minHeight: '44px' }}
          >
            复制提示词
          </Button>
          <Button
            type="primary"
            icon={<VideoCameraOutlined />}
            onClick={handleNext}
            size="large"
            style={{ minWidth: '140px', minHeight: '44px' }}
          >
            生成视频
          </Button>
        </Space>
      </div>
    </div>
  )
}
