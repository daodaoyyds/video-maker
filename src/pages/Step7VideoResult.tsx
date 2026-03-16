import { useState } from 'react'
import { Card, Button, Space, Typography, Progress, Result, Tag, Tooltip, Alert } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined, ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'

interface Step7Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

export default function Step7VideoResult({ onPrev }: Step7Props) {
  const { 
    productName, 
    videoDuration, 
    aspectRatio,
    finalPrompt 
  } = useProjectStore()
  
  const [generating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [, setError] = useState<string | null>(null)

  const handleDownload = () => {
    // 实际项目中这里会下载真实视频
    alert('视频下载功能将在对接扣子智能体后启用')
  }

  const handleRegenerate = () => {
    setVideoUrl(null)
    setProgress(0)
    setError(null)
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        步骤 5：视频生成
      </h2>

      {/* 置灰提示 */}
      <Alert
        message="视频生成功能暂不可用"
        description="此功能需要对接扣子智能体API，目前处于开发阶段。您可以预览完整的工作流程。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {!generating && !videoUrl && (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <VideoCameraOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '24px' }} />
          <Title level={4} style={{ color: '#999' }}>视频生成</Title>
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            点击下方按钮开始生成视频
            <br />
            <Tag>{productName}</Tag>
            <Tag>{videoDuration}秒</Tag>
            <Tag>{aspectRatio}</Tag>
          </Paragraph>
          <Tooltip title="功能开发中，暂不可用">
            <Button 
              type="primary" 
              size="large" 
              disabled
              icon={<PlayCircleOutlined />}
            >
              开始生成视频
            </Button>
          </Tooltip>
          
          <div style={{ marginTop: '24px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              预计生成时间：3-5分钟
            </Text>
          </div>
        </Card>
      )}

      {generating && (
        <Card style={{ textAlign: 'center', padding: '80px' }}>
          <Progress
            type="circle"
            percent={Math.min(Math.round(progress), 99)}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            size={200}
          />
          <Title level={4} style={{ marginTop: '32px' }}>
            正在生成视频...
          </Title>
          <Paragraph type="secondary">
            正在调用视频生成模型，请耐心等待
            <br />
            当前步骤：渲染画面帧
          </Paragraph>
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
                disabled
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

          <Card title="🎬 视频预览" style={{ marginTop: '24px' }}>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              height: aspectRatio === '9:16' ? '500px' : '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}>
              <div style={{ textAlign: 'center', color: '#999' }}>
                <PlayCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Paragraph>视频预览区域</Paragraph>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  对接扣子智能体后将显示真实视频
                </Text>
              </div>
            </div>
          </Card>

          <Card title="📋 生成信息" style={{ marginTop: '16px' }} size="small">
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
              2026-03-15 17:45:00
            </Paragraph>
            <Paragraph>
              <Text strong>模型版本：</Text>
              VideoGen-v2.0
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
