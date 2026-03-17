import { useState, useRef, useEffect } from 'react'
import { Card, Button, Space, Typography, Progress, Result, Tag, Alert, Divider, Steps, List } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, VideoCameraOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { 
  generateVideo, 
  waitForVideoCompletion, 
  getVideoDownloadUrl,
} from '../api/cloudsway'
import { aspectRatioToSize, clampDuration } from '../config/videoProviders'

interface Step7Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const GENERATION_STEPS = [
  { title: '提交任务', description: '发送生成请求' },
  { title: 'AI生成中', description: 'Sora渲染视频' },
  { title: '处理完成', description: '视频生成完毕' },
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
  const [videoId, setVideoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  // 预计5分钟 // 预计5分钟
  const logsEndRef = useRef<HTMLDivElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 自动滚动日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  // 检查是否可以生成视频
  const canGenerate = () => {
    if (!finalPrompt || finalPrompt.length < 10) {
      return { valid: false, reason: '提示词不完整，请返回第4步生成提示词' }
    }
    return { valid: true, reason: '' }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  // 模拟进度增长
  const startProgressSimulation = () => {
    setProgress(0)
    setCurrentStep(1)
    
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        // 非线性增长，前期快后期慢
        const increment = Math.max(1, Math.floor((100 - prev) / 10))
        return Math.min(prev + increment, 95)
      })
    }, 3000)
  }

  const stopProgressSimulation = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
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
    setVideoId(null)
    setLogs([])

    try {
      // 准备参数
      const size = aspectRatioToSize(aspectRatio)
      const seconds = clampDuration(videoDuration).toString()
      
      addLog('开始视频生成任务...')
      addLog(`产品: ${productName}`)
      addLog(`参数: ${size}, ${seconds}秒`)
      addLog(`提示词长度: ${finalPrompt?.length || 0} 字符`)

      // Step 1: 提交生成任务
      addLog('正在提交生成请求...')
      const newVideoId = await generateVideo({
        prompt: finalPrompt,
        size,
        seconds,
      })
      
      setVideoId(newVideoId)
      addLog(`任务已提交，视频ID: ${newVideoId}`)
      setCurrentStep(1)
      
      // 开始模拟进度
      startProgressSimulation()
      
      // Step 2: 轮询等待完成
      addLog('等待视频生成完成...')
      const finalStatus = await waitForVideoCompletion(
        newVideoId,
        (status, attempt) => {
          addLog(`查询状态 #${attempt}: ${status.status}`)
          if (status.status === 'processing') {
            setCurrentStep(1)
          }
        },
        60, // 最多查询60次
        5000 // 每5秒查询一次
      )
      
      // 停止模拟进度
      stopProgressSimulation()
      
      // 完成
      setProgress(100)
      setCurrentStep(2)
      addLog('视频生成完成！')
      
      if (finalStatus.url) {
        setVideoUrl(finalStatus.url)
        addLog(`视频URL: ${finalStatus.url}`)
      } else {
        // 如果没有直接返回URL，构造下载URL
        const downloadUrl = await getVideoDownloadUrl(newVideoId)
        setVideoUrl(downloadUrl)
        addLog(`下载URL: ${downloadUrl}`)
      }
      
    } catch (err: any) {
      stopProgressSimulation()
      const errorMsg = err?.message || '未知错误'
      addLog(`错误: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!videoId) return
    
    try {
      addLog('准备下载视频...')
      const downloadUrl = await getVideoDownloadUrl(videoId)
      
      // 使用 fetch 获取视频内容
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': 'Bearer C3GxBl02Wh5nlP6ypAQN',
        },
      })
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = url
      link.download = `${productName || 'video'}_${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
      addLog('视频下载完成！')
    } catch (err: any) {
      addLog(`下载错误: ${err.message}`)
      // 如果下载失败，尝试直接打开链接
      if (videoUrl) {
        window.open(videoUrl, '_blank')
      }
    }
  }

  const handleRegenerate = () => {
    setVideoUrl(null)
    setVideoId(null)
    setProgress(0)
    setCurrentStep(0)
    setError(null)
    setLogs([])
    addLog('准备重新生成...')
  }

  // 获取视频尺寸样式
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

      {/* 错误提示 */}
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

      {/* 配置不完整提示 */}
      {!check.valid && !error && (
        <Alert
          message="无法生成视频"
          description={check.reason}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 初始状态 - 准备生成 */}
      {!generating && !videoUrl && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <VideoCameraOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
          <Title level={4}>视频生成</Title>
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            基于最终提示词生成产品宣传视频
          </Paragraph>
          
          {/* 生成参数预览 */}
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
              <Text>{clampDuration(videoDuration)}秒 (API限制4-12秒)</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>画面比例：</Text>
              <Tag>{aspectRatio}</Tag>
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                ({aspectRatioToSize(aspectRatio)})
              </Text>
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

      {/* 生成中状态 */}
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
              已用时：{Math.floor(progress * 5 / 100)}分钟 / 预计3-5分钟
            </Paragraph>
            {videoId && (
              <Paragraph type="secondary" style={{ marginTop: '8px' }}>
                <Text type="secondary">任务ID: </Text>
                <Text copyable style={{ fontSize: '12px' }}>{videoId}</Text>
              </Paragraph>
            )}
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

      {/* 生成完成状态 */}
      {videoUrl && (
        <>
          <Result
            status="success"
            title="视频生成完成！"
            subTitle={`${productName} - ${clampDuration(videoDuration)}秒 - ${aspectRatio}`}
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
                position: 'relative',
                overflow: 'hidden'
              }}>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                  onError={() => {
                    addLog('视频加载失败，请尝试下载')
                  }}
                />
              </div>
            </div>
          </Card>

          <Card title="生成信息" style={{ marginTop: '16px' }} size="small">
            <Paragraph>
              <Text strong>视频ID：</Text>
              <Text copyable style={{ fontSize: '12px' }}>{videoId}</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>提示词长度：</Text>
              {finalPrompt?.length || 0} 字符
            </Paragraph>
            <Paragraph>
              <Text strong>视频参数：</Text>
              {clampDuration(videoDuration)}秒 / {aspectRatio} / {aspectRatioToSize(aspectRatio)}
            </Paragraph>
            <Paragraph>
              <Text strong>生成时间：</Text>
              {new Date().toLocaleString('zh-CN')}
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
