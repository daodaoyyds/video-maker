import { useState, useCallback, useEffect } from 'react'
import { Card, Button, Space, Tag, Row, Col, Typography, Badge, Spin, message, Divider } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons'
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
    return `请根据以下信息，生成4个短视频脚本提案，并以JSON格式返回。

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

请生成4个不同的脚本提案，并以JSON格式返回，必须包含以下完整字段：

{
  "scripts": [
    {
      "script_id": "脚本1-1",
      "title": "脚本标题",
      "relationship": {
        "dimension": "关系维度",
        "specific": "具体关系描述"
      },
      "scene": {
        "location": "场景地点",
        "function": "场景的专属功能"
      },
      "character": {
        "age": "年龄",
        "occupation": "职业",
        "appearance": "外貌特征",
        "clothing": "穿着风格",
        "emotional_state": "当下情绪状态"
      },
      "constraints": ["硬性约束1", "硬性约束2"],
      "rhythm_curve": ["情绪阶段1", "情绪阶段2", "情绪阶段3"],
      "script_detail": {
        "hook": {
          "time_range": "0-2s",
          "description": "钩子描述"
        },
        "pain_point_exposure": {
          "time_range": "3-7s",
          "description": "痛点暴露描述"
        },
        "product_solution": {
          "time_range": "8-12s",
          "description": "产品解决描述"
        },
        "ending": {
          "time_range": "13-15s",
          "description": "结尾描述"
        }
      },
      "diversity_tags": {
        "reversal_type": "反转类型",
        "conflict_dimension": "冲突维度",
        "pain_exposure_method": "痛点暴露方式"
      }
    }
  ]
}

请确保返回的是合法的JSON格式，包含所有字段，不要包含任何其他文本。`
  }, [productName, productInfo, selectedTA, sceneScale, plotScale])

  // 调用脚本生成智能体
  const generateScripts = async () => {
    setLoading(true)
    const sessionId = generateSessionId()
    
    try {
      let fullAnswer = ''
      
      await callCozeAgent(
        AGENT_CONFIGS.scriptProposal,
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
              if (data.length > 0) {
                setScripts(data)
                message.success('脚本生成完成！')
              } else {
                message.error('脚本生成失败：返回数据为空')
              }
            } catch (error) {
              console.error('Parse script response error:', error)
              message.error('脚本生成失败：数据解析错误')
            }
          },
          onError: (error) => {
            message.destroy()
            console.error('Script generation error:', error)
            message.error('脚本生成失败：API调用错误')
          }
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // 解析脚本响应
  const parseScriptResponse = (response: string): ScriptProposal[] => {
    // 尝试匹配 JSON 对象（包含 scripts 数组）
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        const data = JSON.parse(objectMatch[0])
        if (data.scripts && Array.isArray(data.scripts)) {
          return data.scripts.map((item: any, index: number) => ({
            id: item.script_id || `script${index + 1}`,
            script_id: item.script_id,
            title: item.title || '未命名脚本',
            relationship: item.relationship || '未知',
            characterSetting: item.character ? `${item.character.age}，${item.character.occupation}，${item.character.appearance}` : '暂无',
            summary: item.scene ? `${item.scene.location} - ${item.scene.function}` : '暂无',
            outline: item.script_detail ? 
              `钩子(${item.script_detail.hook?.time_range}): ${item.script_detail.hook?.description}\n` +
              `痛点(${item.script_detail.pain_point_exposure?.time_range}): ${item.script_detail.pain_point_exposure?.description}\n` +
              `解决(${item.script_detail.product_solution?.time_range}): ${item.script_detail.product_solution?.description}\n` +
              `结尾(${item.script_detail.ending?.time_range}): ${item.script_detail.ending?.description}`
              : '暂无',
            scene: item.scene,
            character: item.character,
            constraints: item.constraints,
            rhythm_curve: item.rhythm_curve,
            script_detail: item.script_detail,
            diversity_tags: item.diversity_tags,
          }))
        }
      } catch (e) {
        console.error('Object parse error:', e)
      }
    }
    
    throw new Error('No JSON found in response')
  }



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
                    <Tag color="blue" style={{ fontSize: '13px' }}>
                      {typeof script.relationship === 'string' 
                        ? script.relationship 
                        : script.relationship?.dimension || '未知'}
                    </Tag>
                  </Space>

                  <Paragraph style={{ fontSize: '14px' }}>
                    <Text strong>人物设定：</Text>
                    {script.characterSetting}
                  </Paragraph>

                  <Paragraph style={{ fontSize: '14px' }}>
                    <Text strong>创意亮点：</Text>
                    {script.summary}
                  </Paragraph>

                  <Divider style={{ margin: '12px 0' }} />

                  <Paragraph style={{ fontSize: '14px' }}>
                    <Text strong>大纲：</Text>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '8px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      marginTop: '8px',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      {script.outline}
                    </pre>
                  </Paragraph>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
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
            下一步：提示词预览
          </Button>
        </Space>
      </div>
    </div>
  )
}
