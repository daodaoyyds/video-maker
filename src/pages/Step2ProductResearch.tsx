import { useState } from 'react'
import { Card, Button, Space, Spin, message, Tag, Radio, Row, Col, Typography } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'

interface Step2Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

// 模拟TA画像数据
const mockTAs = [
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
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState<any>(null)
  const [selectedTA, setSelectedTA] = useState<string | null>(null)
  const [sceneScale, setSceneScale] = useState('日常')
  const [plotScale, setPlotScale] = useState('轻度')

  // 模拟调用扣子智能体进行产品调研
  const handleResearch = async () => {
    setLoading(true)
    
    // 模拟API调用延迟
    setTimeout(() => {
      setProductInfo({
        basicInfo: `${productName}，规格50ml，价格¥299，适合干皮/混干肤质`,
        coreTech: '采用光感科技，蕴含烟酰胺+维生素C衍生物',
        coreBenefits: '提亮肤色、均匀肤色、隐形毛孔、越夜越美丽',
        painPoints: '解决肤色暗沉、毛孔粗大、妆感不服帖等问题',
      })
      setLoading(false)
      message.success('产品调研完成！')
    }, 2000)
  }

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
        第二步：AI产品调研
      </h2>

      {!productInfo && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <img
            src={productImage || ''}
            alt="产品图片"
            style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', marginBottom: '24px' }}
          />
          <Title level={4}>{productName}</Title>
          <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
            点击开始调研，AI将分析产品信息并生成TA画像
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={handleResearch}
          >
            开始产品调研
          </Button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#666' }}>
            AI正在分析产品信息...
          </p>
        </div>
      )}

      {productInfo && !loading && (
        <>
          <Card title="📦 产品信息" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <img
                  src={productImage || ''}
                  alt="产品图片"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                />
              </Col>
              <Col span={12}>
                <Title level={5}>{productName}</Title>
                <Paragraph>
                  <Text strong>基本信息：</Text>{productInfo.basicInfo}
                </Paragraph>
                <Paragraph>
                  <Text strong>核心技术：</Text>{productInfo.coreTech}
                </Paragraph>
                <Paragraph>
                  <Text strong>核心功效：</Text>{productInfo.coreBenefits}
                </Paragraph>
                <Paragraph>
                  <Text strong>解决痛点：</Text>{productInfo.painPoints}
                </Paragraph>
              </Col>
            </Row>
          </Card>

          <Card title="👥 TA画像选择" style={{ marginBottom: '24px' }}>
            <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
              基于社媒调研，我们为您生成了以下TA画像，请选择最符合您产品定位的目标人群：
            </Paragraph>
            
            <Row gutter={[16, 16]}>
              {mockTAs.map((ta) => (
                <Col span={12} key={ta.id}>
                  <Card
                    hoverable
                    style={{
                      borderColor: selectedTA === ta.id ? '#1890ff' : undefined,
                      backgroundColor: selectedTA === ta.id ? '#e6f7ff' : undefined,
                    }}
                    onClick={() => setSelectedTA(ta.id)}
                  >
                    <Title level={5}>{ta.name}</Title>
                    <Tag color="blue">{ta.age}</Tag>
                    <Tag color="green">{ta.skinType}</Tag>
                    <Paragraph style={{ marginTop: '12px' }}>
                      <Text strong>痛点：</Text>
                      {ta.painPoints.join('、')}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>使用场景：</Text>
                      {ta.scenes.join('、')}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>消费动机：</Text>
                      {ta.motivation}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title="🎬 场景与情节设置" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>场景尺度</Title>
                <Radio.Group
                  value={sceneScale}
                  onChange={(e) => setSceneScale(e.target.value)}
                >
                  <Space direction="vertical">
                    {sceneScales.map((scale) => (
                      <Radio key={scale.value} value={scale.value}>
                        <Text strong>{scale.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {scale.desc}
                        </Text>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Col>
              <Col span={12}>
                <Title level={5}>情节尺度</Title>
                <Radio.Group
                  value={plotScale}
                  onChange={(e) => setPlotScale(e.target.value)}
                >
                  <Space direction="vertical">
                    {plotScales.map((scale) => (
                      <Radio key={scale.value} value={scale.value}>
                        <Text strong>{scale.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {scale.desc}
                        </Text>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Col>
            </Row>
          </Card>

          <Space style={{ marginTop: '24px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
              上一步
            </Button>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleNext}
              disabled={!selectedTA}
            >
              下一步：生成脚本提案
            </Button>
          </Space>
        </>
      )}
    </div>
  )
}
