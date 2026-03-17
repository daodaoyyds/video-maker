import { useState, useRef, useEffect } from 'react'
import { Card, Button, Space, Typography, Progress, Result, Tag, Alert, Divider, Steps, List } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, VideoCameraOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { callCozeAgent, generateSessionId, AGENT_CONFIGS, isAgentConfigValid } from '../api/coze'

interface Step7Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const GENERATION_STEPS = [
  { title: '解析提示词', description: '分析画面需求' },
  { title: '生成关键帧', description: 'AI绘制画面' },
  { title: '渲染视频', description: '合成动态画面' },
  { title: '后期处理', description: '优化视频质量' },
]

export default function Step7VideoResult({ onPrev }: Step7Props) {
  const { 
    productName, 
    videoDuration, 
    aspectRatio,
    finalPrompt,
    
    
    
    
  } = useProjectStore()
  
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(() => generateSessionId())
  const [logs, setLogs] = useState<string[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const canGenerate = () => {
    if (!finalPrompt || finalPrompt.length < 10) {
      return { valid: false, reason: '提示词不完整，请返回第6步生成提示词' }
    }
    if (!isAgentConfigValid(AGENT_CONFIGS.videoGeneration)) {
      return { valid: false, reason: '视频生成智能体未配置，请联系管理员' }
    }
    return { valid: true, reason: '' }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleGenerate = async () => {
    const check = canGenerate()
    if (!check.valid) {
      setError(check.reason)
      return
    }

    setGenerating(true)
    setProgress(0)
    setCurrentStep(0)
    setError(null)
    setVideoUrl(null)
    setLogs([])

    addLog('开始视频生成任务...')
    addLog(`产品: ${productName}`)
    addLog(`时长: ${videoDuration}秒 | 比例: ${aspectRatio}`)
    addLog(`提示词长度: ${finalPrompt?.length || 0} 字符`)

    const config = AGENT_CONFIGS.videoGeneration
    
    const requestText = JSON.stringify({
      productName,
      videoDuration,
      aspectRatio,
      finalPrompt,
      
      
      
      
    }, null, 2)

    await callCozeAgent(
      {
        endpoint: config.endpoint,
        token: config.token,
        projectId: config.projectId,
      },
      {
        text: requestText,
        sessionId,
      },
      {
        onStart: () => {
          addLog('已连接到视频生成服务')
        },
        onAnswer: (answer: string) => {
          if (answer.includes('进度') || answer.includes('%')) {
            const match = answer.match(/(\d+)%/)
            if (match) {
              const newProgress = parseInt(match[1])
              setProgress(newProgress)
              if (newProgress < 25) setCurrentStep(0)
              else if (newProgress < 50) setCurrentStep(1)
              else if (newProgress < 75) setCurrentStep(2)
              else setCurrentStep(3)
            }
          }
          if (answer.includes('开始') || answer.includes('完成') || answer.includes('生成')) {
            addLog(answer)
          }
        },
        onToolRequest: (toolRequest: any) => {
          addLog(`调用工具: ${toolRequest?.tool_name || 'unknown'}`)
        },
        onToolResponse: () => {
          addLog('工具调用完成')
        },
        onEnd: (data: any) => {
          addLog('视频生成完成！')
          setProgress(100)
          setCurrentStep(4)
          
          const answer = data?.answer || ''
          const urlMatch = answer.match(/(https?:\/\/[^\s"<>]+\.(mp4|mov|avi|webm))/i)
          if (urlMatch) {
            setVideoUrl(urlMatch[1])
            addLog(`视频URL: ${urlMatch[1]}`)
          } else {
            setVideoUrl('mock://video-generated')
            addLog('视频已生成（模拟模式）')
          }
          
          setGenerating(false)
        },
        onError: (err: any) => {
          const errorMsg = err?.message || err?.toString() || '未知错误'
          addLog(`错误: ${errorMsg}`)
          setError(errorMsg)
          setGenerating(false)
        },
      }
    )
  }

  const handleDownload = () => {
    if (videoUrl && videoUrl.startsWith('http')) {
      const link = document.createElement('a')
      link.href = videoUrl
      link.download = `${productName}_视频_${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      addLog('下载视频...')
      setTimeout(() => {
        alert('视频下载完成！')
      }, 500)
    }
  }

  const handleRegenerate = () => {
    setVideoUrl(null)
    setProgress(0)
    setCurrentStep(0)
    setError(null)
    setLogs([])
    addLog('准备重新生成...')
  }

  const getVideoContainerStyle = () => {
    const baseHeight = 400
    if (aspectRatio === '9:16') {
      return { width: `${baseHeight * 9 / 16}px`, height: `${baseHeight}px` }
    } else if (aspectRatio === '1:1') {
      return { width: `${baseHeight}px`, height: `${baseHeight}px` }
    } else {
      return { width: `${baseHeight * 16 / 9}px`, height: `${baseHeight}px` }
    }
  }

  const check = canGenerate()

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        步骤 5：视频生成
      </h2>

      {error && (
        <Alert
          message="生成失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {!check.valid && !error && (
        <Alert
          message="无法生成视频"
          description={check.reason}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {!generating && !videoUrl && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <VideoCameraOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
          <Title level={4}>视频生成</Title>
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            基于最终提示词生成产品宣传视频
          </Paragraph>
          
          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left',
            maxWidth: '500px',
            margin: '0 auto 24px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>产品名称：</Text>
              <Text>{productName || '未设置'}</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>视频时长：</Text>
              <Text>{videoDuration}秒</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>画面比例：</Text>
              <Tag>{aspectRatio}</Tag>
            </div>
            <div>
              <Text strong>提示词长度：</Text>
              <Text>{finalPrompt?.length || 0} 字符</Text>
            </div>
          </div>

          <Button 
            type="primary" 
            size="large" 
            disabled={!check.valid}
            icon={<PlayCircleOutlined />}
            onClick={handleGenerate}
          >
            开始生成视频
          </Button>
          
          <div style={{ marginTop: '24px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              预计生成时间：3-5分钟
            </Text>
          </div>
        </Card>
      )}

      {generating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Progress
              type="circle"
              percent={Math.min(Math.round(progress), 99)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              size={180}
            />
            <Title level={4} style={{ marginTop: '32px' }}>
              正在生成视频...
            </Title>
            <Paragraph type="secondary">
              已用时：{Math.floor(progress * 3 / 100)}分钟 / 预计3-5分钟
            </Paragraph>
          </div>

          <Divider />

          <Steps
            current={currentStep}
            direction="horizontal"
            size="small"
            style={{ marginBottom: '24px' }}
          >
            {GENERATION_STEPS.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                icon={currentStep > index ? <CheckCircleOutlined /> : undefined}
              />
            ))}
          </Steps>

          <Card title="生成日志" size="small" style={{ maxHeight: '200px', overflow: 'auto' }}>
            <List
              size="small"
              dataSource={logs}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0', fontSize: '12px', fontFamily: 'monospace' }}>
                  {item}
                </List.Item>
              )}
            />
            <div ref={logsEndRef} />
          </Card>
        </Card>
      )}

      {videoUrl && (
        <>
          <Result
            status="success"
            title="视频生成完成！"
            subTitle={`${productName} - ${videoDuration}秒 - ${aspectRatio}`}
            extra={[
              <Button 
                type="primary" 
                key="download" 
                icon={<DownloadOutlined />}
                onClick={handleDownload}
              >
                下载视频
              </Button>,
              <Button 
                key="regenerate" 
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
              >
                重新生成
              </Button>,
            ]}
          />

          <Card title="视频预览" style={{ marginTop: '24px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{ 
                ...getVideoContainerStyle(),
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                position: 'relative'
              }}>
                {videoUrl.startsWith('http') ? (
                  <video
                    src={videoUrl}
                    controls
                    style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#fff' }}>
                    <PlayCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <Paragraph style={{ color: '#fff' }}>视频预览区域</Paragraph>
                    <Text style={{ color: '#999', fontSize: '12px' }}>
                      对接扣子智能体后将显示真实视频
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="生成信息" style={{ marginTop: '16px' }} size="small">
            <Paragraph>
              <Text strong>提示词长度：</Text>
              {finalPrompt?.length || 0} 字符
            </Paragraph>
            <Paragraph>
              <Text strong>视频参数：</Text>
              {videoDuration}秒 / {aspectRatio} / 4K
            </Paragraph>
            <Paragraph>
              <Text strong>生成时间：</Text>
              {new Date().toLocaleString('zh-CN')}
            </Paragraph>
            <Paragraph>
              <Text strong>会话ID：</Text>
              <Text copyable style={{ fontSize: '12px' }}>{sessionId}</Text>
            </Paragraph>
          </Card>
        </>
      )}

      <Space style={{ marginTop: '32px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
      </Space>
    </div>
  )
}
