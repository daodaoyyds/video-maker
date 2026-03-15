import { useState } from 'react'
import { Card, Button, Space, Typography, Row, Col, Timeline, Tag, Progress } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'

interface Step5Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

export default function Step5EnhancedScript({ onNext, onPrev }: Step5Props) {
  const { videoDuration, aspectRatio } = useProjectStore()
  const [enhancing, setEnhancing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enhanced, setEnhanced] = useState(false)

  // 模拟脚本增强数据
  const enhancedData = {
    style: {
      overall: '偏向现代简约风格，强调生活场景的真实还原，色彩以温馨柔和的色调为主',
      texture: '采用高清晰度数码拍摄，清晰展现人物状态、产品质地以及肌肤变化细节',
      aesthetic: '构图以人物为中心，突出人物面部表情和动作，同时合理展示产品',
      mood: '整体情感氛围从苦恼转变为惊喜，突出产品带来的改变',
    },
    cinematography: {
      camera: '以中景为主，距离人物2-3米，能够完整展现人物坐在梳妆台前的状态',
      lens: '使用50mm人像镜头，提供自然视角，适度变形，真实还原人物面部细节',
      lighting: '采用柔和暖光，色温控制在3000K-3500K，以台灯作为主要光源',
      mood: '情绪基调从开场的苦恼转变为结尾的惊喜',
    },
    shots: [
      {
        id: 1,
        time: '0-5秒',
        title: '开场场景',
        description: '画面中，年轻女性慵懒地坐在梳妆台前，灯光柔和。她打了个哈欠，揉了揉眼睛，看着镜子里略显憔悴的自己，眉头皱起，露出苦恼的表情。',
        camera: '静止机位，中景',
        focus: '人物表情',
      },
      {
        id: 2,
        time: '5-10秒',
        title: '核心内容',
        description: '女性轻轻打开产品，取适量在指尖，均匀涂抹在脸上，双手轻柔按摩至吸收，靠在椅子上闭眼享受。随着时间推移，她的表情逐渐放松。',
        camera: '特写+中景切换',
        focus: '产品使用+表情变化',
      },
      {
        id: 3,
        time: '10-15秒',
        title: '结尾收尾',
        description: '15分钟后，女性缓缓睁开眼睛，拿起镜子照自己的脸，手指轻轻触摸脸颊，眼睛睁大，露出惊喜的笑容，对着镜头展示焕活后的肌肤。',
        camera: '缓慢推近特写',
        focus: '最终效果展示',
      },
    ],
  }

  const handleEnhance = async () => {
    setEnhancing(true)
    setProgress(0)
    
    // 模拟进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setEnhancing(false)
          setEnhanced(true)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        第五步：脚本增强
      </h2>

      {!enhanced && !enhancing && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <VideoCameraOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
          <Title level={4}>脚本增强</Title>
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            AI将为您的脚本添加详细的拍摄指导、风格描述和分镜设计
            <br />
            视频参数：<Tag>{videoDuration}秒</Tag> <Tag>{aspectRatio}</Tag>
          </Paragraph>
          <Button type="primary" size="large" onClick={handleEnhance}>
            开始脚本增强
          </Button>
        </Card>
      )}

      {enhancing && (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <Progress percent={progress} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />
          <Paragraph style={{ marginTop: '24px' }}>
            正在优化脚本，添加拍摄指导...
          </Paragraph>
        </Card>
      )}

      {enhanced && (
        <>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="🎨 风格描述">
                <Paragraph>
                  <Text strong>整体风格：</Text>
                  {enhancedData.style.overall}
                </Paragraph>
                <Paragraph>
                  <Text strong>拍摄质感：</Text>
                  {enhancedData.style.texture}
                </Paragraph>
                <Paragraph>
                  <Text strong>商业美感：</Text>
                  {enhancedData.style.aesthetic}
                </Paragraph>
                <Paragraph>
                  <Text strong>情感氛围：</Text>
                  {enhancedData.style.mood}
                </Paragraph>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="🎬 拍摄指导">
                <Paragraph>
                  <Text strong>Camera：</Text>
                  {enhancedData.cinematography.camera}
                </Paragraph>
                <Paragraph>
                  <Text strong>Lens：</Text>
                  {enhancedData.cinematography.lens}
                </Paragraph>
                <Paragraph>
                  <Text strong>Lighting：</Text>
                  {enhancedData.cinematography.lighting}
                </Paragraph>
                <Paragraph>
                  <Text strong>Mood：</Text>
                  {enhancedData.cinematography.mood}
                </Paragraph>
              </Card>
            </Col>
          </Row>

          <Card title="📽️ 分镜描述" style={{ marginTop: '16px' }}>
            <Timeline
              items={enhancedData.shots.map((shot) => ({
                color: shot.id === 1 ? 'blue' : shot.id === 2 ? 'green' : 'orange',
                label: <Tag color="processing">{shot.time}</Tag>,
                children: (
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      Shot {shot.id}：{shot.title}
                    </Text>
                    <Paragraph style={{ marginTop: '8px', marginBottom: '8px' }}>
                      {shot.description}
                    </Paragraph>
                    <Space>
                      <Tag size="small">{shot.camera}</Tag>
                      <Tag size="small" color="blue">{shot.focus}</Tag>
                    </Space>
                  </div>
                ),
              }))}
            />
          </Card>
        </>
      )}

      <Space style={{ marginTop: '32px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
        {enhanced && (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={onNext}
          >
            下一步：生成提示词
          </Button>
        )}
      </Space>
    </div>
  )
}
