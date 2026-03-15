import { useState } from 'react'
import { Card, Button, Space, Tag, Row, Col, Typography, Badge } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore, type ScriptProposal } from '../stores/projectStore'

interface Step3Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography

// 模拟脚本提案数据
const mockScripts: ScriptProposal[] = [
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

export default function Step3ScriptProposal({ onNext, onPrev }: Step3Props) {
  const { selectedScript, setStep3Data, sceneScale, plotScale } = useProjectStore()
  const [localSelected, setLocalSelected] = useState<ScriptProposal | null>(selectedScript)

  const handleSelect = (script: ScriptProposal) => {
    setLocalSelected(script)
  }

  const handleNext = () => {
    if (!localSelected) {
      return
    }
    
    setStep3Data({
      scripts: mockScripts,
      selectedScript: localSelected,
    })
    
    onNext()
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        第三步：脚本提案
      </h2>

      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        基于您选择的「<Text strong>{sceneScale}</Text>」场景 + 「<Text strong>{plotScale}</Text>」情节，
        AI为您生成了以下脚本提案，请选择最符合您需求的脚本：
      </Paragraph>

      <Row gutter={[16, 16]}>
        {mockScripts.map((script, index) => (
          <Col span={12} key={script.id}>
            <Badge.Ribbon
              text={`脚本 ${index + 1}`}
              color={localSelected?.id === script.id ? '#52c41a' : '#1890ff'}
            >
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderColor: localSelected?.id === script.id ? '#52c41a' : undefined,
                  backgroundColor: localSelected?.id === script.id ? '#f6ffed' : undefined,
                }}
                onClick={() => handleSelect(script)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Title level={5} style={{ margin: 0, marginBottom: '12px' }}>
                    {script.title}
                    {localSelected?.id === script.id && (
                      <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: '8px' }} />
                    )}
                  </Title>
                </div>

                <Space wrap style={{ marginBottom: '12px' }}>
                  <Tag color="blue">{script.relationship}</Tag>
                </Space>

                <Paragraph>
                  <Text strong>人物设定：</Text>
                  {script.characterSetting}
                </Paragraph>

                <Paragraph>
                  <Text strong>创意亮点：</Text>
                  {script.summary}
                </Paragraph>

                <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                  <EyeOutlined style={{ marginRight: '4px' }} />
                  点击卡片查看完整脚本详情
                </Paragraph>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      {localSelected && (
        <Card 
          title="📋 选中脚本详情" 
          style={{ marginTop: '24px', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Title level={4}>{localSelected.title}</Title>
          <Tag color="blue" style={{ marginBottom: '16px' }}>{localSelected.relationship}</Tag>
          
          <Paragraph>
            <Text strong>人物设定：</Text>
            <br />
            {localSelected.characterSetting}
          </Paragraph>
          
          <Paragraph>
            <Text strong>大纲：</Text>
            <pre style={{ 
              backgroundColor: '#fff', 
              padding: '12px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              fontSize: '13px',
              lineHeight: '1.8'
            }}>
              {localSelected.outline}
            </pre>
          </Paragraph>
        </Card>
      )}

      <Space style={{ marginTop: '32px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleNext}
          disabled={!localSelected}
        >
          下一步：脚本增强
        </Button>
      </Space>
    </div>
  )
}
