import { Card, Button, Space, Typography, Timeline, Tag, Row, Col } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'

interface Step4Props {
  onNext: () => void
  onPrev: () => void
}

const { Text, Paragraph } = Typography

export default function Step4ScriptDetail({ onNext, onPrev }: Step4Props) {
  const { selectedScript } = useProjectStore()

  // 模拟详细脚本数据
  const scriptDetail = {
    characterAppearance: `一位25岁左右的年轻女性，身材苗条，面容略显憔悴，黑眼圈较重，头发随意扎起。
她身着一套宽松的棉质睡衣，材质柔软，颜色淡雅，展现出居家的舒适感，整体气质透露出一丝疲惫但不失青春活力。`,
    expressionChanges: `开场时，眼神黯淡无光，眉头微微皱起，嘴角下垂，呈现出因熬夜而带来的苦恼神情。
在使用产品过程中，随着时间推移，眼神逐渐放松，眉毛舒缓，嘴角微微上扬，透露出享受和期待。
最后看到效果时，眼睛睁大，眼神惊喜明亮，嘴角大幅上扬，露出满意的笑容。`,
    actionDetails: `开场，她慵懒地坐在梳妆台前，打了个哈欠，用手揉了揉眼睛。
拿起产品，仔细查看包装说明，然后轻轻打开盖子，取适量产品在指尖。
将产品均匀涂抹在脸上，双手轻柔按摩至吸收，靠在椅子上闭眼享受。
15分钟后，她缓缓睁开眼睛，用镜子照了照自己的脸，手指轻轻触摸脸颊。`,
    sceneEnvironment: `场景设定在温馨的卧室梳妆台前，梳妆台摆放整齐，有一些日常护肤品和化妆品。
台面上有一盏柔和的台灯，发出暖黄色的光，照亮整个画面，营造出温馨的氛围。
周围墙壁是淡淡的粉色，窗帘为浅灰色，与整体色调相协调。`,
    dialogues: `「哎呀，昨晚又熬夜了，这脸简直没法看了。试试这款急救产品，希望能拯救一下。」
「哇，才15分钟，这效果也太明显了吧，肌肤瞬间焕活啦！」`,
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        第四步：脚本详情
      </h2>

      <Card title={`📖 ${selectedScript?.title}`} style={{ marginBottom: '24px' }}>
        <Tag color="blue" style={{ marginBottom: '16px' }}>
          {selectedScript?.relationship}
        </Tag>

        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Card type="inner" title="👤 人物外貌">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {scriptDetail.characterAppearance}
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="😊 表情变化">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {scriptDetail.expressionChanges}
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="🎬 动作细节">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {scriptDetail.actionDetails}
              </Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="🏠 场景环境">
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {scriptDetail.sceneEnvironment}
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Card type="inner" title="💬 台词" style={{ marginTop: '16px' }}>
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <>
                    <Text strong>开场</Text>
                    <Paragraph style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      "{scriptDetail.dialogues.split('\n')[0].replace(/[「」]/g, '')}"
                    </Paragraph>
                  </>
                ),
              },
              {
                color: 'green',
                children: (
                  <>
                    <Text strong>结尾</Text>
                    <Paragraph style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      "{scriptDetail.dialogues.split('\n')[1]?.replace(/[「」]/g, '') || '效果惊艳！'}"
                    </Paragraph>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </Card>

      <Space style={{ marginTop: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={onNext}
        >
          下一步：脚本增强
        </Button>
      </Space>
    </div>
  )
}
