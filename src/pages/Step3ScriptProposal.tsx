import { useState, useCallback, useEffect } from 'react'
import { Card, Button, Space, Tag, Row, Col, Typography, Badge, Spin, message } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, EyeOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useProjectStore, type ScriptProposal } from '../stores/projectStore'
import { callCozeAgent, generateSessionId, AGENT_CONFIGS } from '../api/coze'

interface Step3Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

export default function Step3ScriptProposal({ onNext, onPrev }: Step3Props) {
  const { 
    productName, 
    productInfo, 
    selectedTA,
    sceneScale, 
    plotScale,
    selectedScript, 
    setStep3Data 
  } = useProjectStore()
  
  const [loading, setLoading] = useState(false)
  const [scripts, setScripts] = useState<ScriptProposal[]>([])
  const [localSelected, setLocalSelected] = useState<ScriptProposal | null>(selectedScript)

  // 构建提示词
  const buildScriptPrompt = useCallback(() => {
    return `请根据以下信息，生成6个短视频脚本提案：

【产品信息】
商品名称：${productName}
核心技术：${productInfo?.coreTech || '暂无'}
核心功效：${productInfo?.coreBenefits || '暂无'}
产品外观：${productInfo?.formDescription || '暂无'}

【TA画像】
TA类型：${selectedTA || '暂无'}

【场景规模】
${sceneScale}

【情节规模】
${plotScale}

请生成6个不同的脚本提案，每个包含：
1. 脚本标题
2. 关系类型（自己/闺蜜/同事/妈妈/暧昧对象等）
3. 人物设定
4. 创意亮点摘要
5. 详细大纲（场景、冲突、转折、结尾）

请以JSON格式返回，便于程序解析。`
  }, [productName, productInfo, selectedTA, sceneScale, plotScale])

  // 调用脚本生成智能体
  const generateScripts = async () => {
    setLoading(true)
    const sessionId = generateSessionId()
    
    try {
      let fullAnswer = ''
      
      await callCozeAgent(
        AGENT_CONFIGS.scriptGeneration,
        { text: buildScriptPrompt(), sessionId },
        {
          onStart: () => {
            message.loading('正在生成脚本提案...', 0)
          },
          onAnswer: (answer) => {
            fullAnswer += answer
          },
          onEnd: () => {
            message.destroy()
            try {
              const data = parseScriptResponse(fullAnswer)
              setScripts(data)
              message.success('脚本生成完成！')
            } catch (error) {
              console.error('Parse script response error:', error)
              // 使用模拟数据
              setScripts(getMockScripts())
              message.warning('使用默认脚本数据')
            }
          },
          onError: (error) => {
            message.destroy()
            console.error('Script generation error:', error)
            // 使用模拟数据
            setScripts(getMockScripts())
            message.warning('使用默认脚本数据')
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // 解析脚本响应
  const parseScriptResponse = (response: string): ScriptProposal[] => {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return data.scripts || data.proposals || []
    }
    throw new Error('No JSON found in response')
  }

  // 模拟脚本数据（备用）
  const getMockScripts = (): ScriptProposal[] => [
    {
      id: 'script1',
      title: '早八通勤的伪素颜秘密',
      relationship: '自己（内心OS）',
      characterSetting: '25岁白领，干皮，早八匆忙出门',
      summary: '通过内心独白展现产品快速上妆、伪素颜效果',
      outline: `场景：化妆台前，时间紧迫
冲突：时间不够，但肤色暗沉
转折：使用产品，快速完成伪素颜妆容
结尾：自信出门，同事夸赞"今天气色真好"`,
    },
    {
      id: 'script2',
      title: '闺蜜的贵妇体验',
      relationship: '闺蜜',
      characterSetting: '28岁闺蜜，追求精致生活',
      summary: '闺蜜间分享贵妇级护肤体验，轻微攀比但温馨',
      outline: `场景：咖啡厅约会
冲突：闺蜜皮肤状态对比
转折：分享产品使用心得
结尾：两人一起变美，约定下次再约`,
    },
    {
      id: 'script3',
      title: '见客户的底气',
      relationship: '同事/客户',
      characterSetting: '30岁职场女性，需要见重要客户',
      summary: '职场场景下，产品带来的自信与专业形象',
      outline: `场景：办公室，下午见客户
冲突：担心脱妆、肤色暗沉影响形象
转折：补妆后状态回春
结尾：客户夸赞专业，成功签单`,
    },
    {
      id: 'script4',
      title: '约会前的急救',
      relationship: '暧昧对象',
      characterSetting: '26岁女生，晚上有重要约会',
      summary: '约会前紧急护肤，产品带来的惊喜转变',
      outline: `场景：家中，约会前2小时
冲突：熬夜后皮肤状态差，担心约会表现
转折：使用产品急救，肌肤焕发光彩
结尾：约会对象惊艳，"你今天真好看"`,
    },
    {
      id: 'script5',
      title: '越夜越美丽的秘密',
      relationship: '自己',
      characterSetting: '32岁，晚上有应酬',
      summary: '长时间带妆场景，展现产品持久效果',
      outline: `场景：晚上10点，应酬结束
冲突：担心带妆一整天脱妆
转折：照镜子发现越夜越美丽
结尾：自拍发朋友圈，收获一堆赞`,
    },
    {
      id: 'script6',
      title: '妈妈的护肤课堂',
      relationship: '妈妈',
      characterSetting: '27岁女儿，妈妈关心护肤',
      summary: '母女互动，妈妈传授护肤心得',
      outline: `场景：家中，母女聊天
冲突：妈妈担心女儿不会护肤
转折：女儿展示产品，妈妈试用后惊艳
结尾：妈妈也想要一瓶，母女一起护肤`,
    },
  ]

  // 组件加载时自动生成脚本
  useEffect(() => {
    if (scripts.length === 0) {
      generateScripts()
    }
  }, [])

  const handleSelect = (script: ScriptProposal) => {
    setLocalSelected(script)
  }

  const handleNext = () => {
    if (!localSelected) {
      message.error('请选择一个脚本！')
      return
    }
    
    setStep3Data({
      scripts: scripts,
      selectedScript: localSelected,
    })
    
    onNext()
  }

  const handleRegenerate = () => {
    generateScripts()
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
      <Title level={3} style={{ marginBottom: '32px', fontSize: '28px', fontWeight: 600 }}>
        步骤 3：脚本提案
      </Title>

      <Paragraph type="secondary" style={{ marginBottom: '24px', fontSize: '16px' }}>
        基于您选择的「<Text strong>{sceneScale}</Text>」场景 + 「<Text strong>{plotScale}</Text>」情节，
        AI为您生成了以下脚本提案，请选择最符合您需求的脚本：
      </Paragraph>

      {/* 加载状态 */}
      {loading && (
        <Card style={{ marginBottom: '24px', textAlign: 'center', borderRadius: '12px' }}>
          <Spin size="large" />
          <Text style={{ marginTop: '16px', display: 'block' }}>正在生成脚本提案...</Text>
        </Card>
      )}

      {/* 脚本卡片 */}
      {!loading && scripts.length > 0 && (
        <Row gutter={[16, 16]}>
          {scripts.map((script, index) => (
            <Col xs={24} sm={12} key={script.id}>
              <Badge.Ribbon
                text={`脚本 ${index + 1}`}
                color={localSelected?.id === script.id ? '#52c41a' : '#1890ff'}
              >
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderColor: localSelected?.id === script.id ? '#52c41a' : '#f0f0f0',
                    backgroundColor: localSelected?.id === script.id ? '#f6ffed' : '#ffffff',
                    borderRadius: '12px',
                    boxShadow: localSelected?.id === script.id 
                      ? '0 4px 12px rgba(82, 196, 26, 0.15)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease',
                    minHeight: '200px'
                  }}
                  onClick={() => handleSelect(script)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Title level={5} style={{ margin: 0, marginBottom: '12px', fontSize: '18px' }}>
                      {script.title}
                      {localSelected?.id === script.id && (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
                      )}
                    </Title>
                  </div>

                  <Space wrap style={{ marginBottom: '12px' }}>
                    <Tag color="blue" style={{ fontSize: '13px' }}>{script.relationship}</Tag>
                  </Space>

                  <Paragraph style={{ fontSize: '14px' }}>
                    <Text strong>人物设定：</Text>
                    {script.characterSetting}
                  </Paragraph>

                  <Paragraph style={{ fontSize: '14px' }}>
                    <Text strong>创意亮点：</Text>
                    {script.summary}
                  </Paragraph>

                  <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                    <EyeOutlined style={{ marginRight: '4px' }} />
                    点击卡片查看完整脚本详情
                  </Paragraph>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      )}

      {/* 选中脚本详情 */}
      {localSelected && (
        <Card 
          title={<span style={{ fontSize: '18px', fontWeight: 600 }}>📋 选中脚本详情</span>}
          style={{ 
            marginTop: '32px', 
            backgroundColor: '#f6ffed', 
            borderColor: '#b7eb8f',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>{localSelected.title}</Title>
          <Tag color="blue" style={{ marginBottom: '16px', fontSize: '14px' }}>{localSelected.relationship}</Tag>
          
          <Paragraph style={{ fontSize: '14px' }}>
            <Text strong>人物设定：</Text>
            <br />
            {localSelected.characterSetting}
          </Paragraph>
          
          <Paragraph style={{ fontSize: '14px' }}>
            <Text strong>大纲：</Text>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '16px', 
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              lineHeight: '1.8',
              marginTop: '8px'
            }}>
              {localSelected.outline}
            </pre>
          </Paragraph>
        </Card>
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
          {!loading && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRegenerate}
              size="large"
              style={{ minWidth: '120px', minHeight: '44px' }}
            >
              重新生成
            </Button>
          )}
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleNext}
            disabled={!localSelected || loading}
            size="large"
            style={{ minWidth: '120px', minHeight: '44px' }}
          >
            下一步：脚本增强
          </Button>
        </Space>
      </div>
    </div>
  )
}
