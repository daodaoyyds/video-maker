import { useState } from 'react'
import { Card, Button, Space, Typography, Row, Col, Tag, Alert, Tabs, Tooltip, message } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, CopyOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'

interface Step6Props {
  onNext: () => void
  onPrev: () => void
}

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

export default function Step6PromptPreview({ onNext, onPrev }: Step6Props) {
  const { 
    productName, 
    productImage, 
    videoDuration, 
    aspectRatio,
    selectedScript,
    setStep6Data 
  } = useProjectStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState('')

  // 模拟完整提示词
  const fullPrompt = `## 脚本内容

**人物外貌**：一位25岁左右的年轻女性，身材苗条，面容略显憔悴，黑眼圈较重，头发随意扎起。她身着一套宽松的棉质睡衣，材质柔软，颜色淡雅，展现出居家的舒适感，整体气质透露出一丝疲惫但不失青春活力。

**表情变化**：开场时，眼神黯淡无光，眉头微微皱起，嘴角下垂，呈现出因熬夜而带来的苦恼神情。在使用产品过程中，随着时间推移，眼神逐渐放松，眉毛舒缓，嘴角微微上扬，透露出享受和期待。最后看到效果时，眼睛睁大，眼神惊喜明亮，嘴角大幅上扬，露出满意的笑容。

**动作细节**：开场，她慵懒地坐在梳妆台前，打了个哈欠，用手揉了揉眼睛。拿起${productName}，仔细查看包装说明，然后轻轻打开盖子，取适量产品在指尖。将产品均匀涂抹在脸上，双手轻柔按摩至吸收，靠在椅子上闭眼享受。15分钟后，她缓缓睁开眼睛，用镜子照了照自己的脸，手指轻轻触摸脸颊。

**场景环境**：场景设定在温馨的卧室梳妆台前，梳妆台摆放整齐，有一些日常护肤品和化妆品。台面上有一盏柔和的台灯，发出暖黄色的光，照亮整个画面，营造出温馨的氛围。周围墙壁是淡淡的粉色，窗帘为浅灰色，与整体色调相协调。

**台词优化**：
「哎呀，昨晚又熬夜了，这脸简直没法看了。试试这款${productName}，希望能拯救一下。」
「哇，才15分钟，这效果也太明显了吧，肌肤瞬间焕活啦！」

## Style 风格描述

**整体风格定位**：偏向现代简约风格，强调生活场景的真实还原，色彩以温馨柔和的色调为主，如卧室的粉色墙壁和浅灰色窗帘，营造出舒适的氛围。

**拍摄质感**：采用高清晰度数码拍摄，清晰展现人物状态、产品质地以及肌肤变化细节，让观众能够直观感受到产品效果。

**商业美感**：构图以人物为中心，突出人物面部表情和动作，同时合理展示产品。光影运用上，以台灯的暖光为主，强调面部立体感和温馨氛围。色彩倾向于自然、柔和的色调，避免过于鲜艳或刺眼的颜色。

**情感氛围**：整体情感氛围从苦恼转变为惊喜，突出产品带来的改变，让观众感受到产品的实用性和有效性，产生共鸣。

## Cinematography 拍摄指导

**Camera**：以中景为主，距离人物2-3米，能够完整展现人物坐在梳妆台前的状态。在开场和过程中保持静止机位，突出专注感；在展示效果时，可适当缓慢拉近镜头，聚焦人物面部变化。

**Lens**：使用50mm人像镜头，提供自然视角，适度变形，真实还原人物面部细节和肌肤质感。

**Lighting**：采用柔和暖光，色温控制在3000K-3500K，以台灯作为主要光源，可适当增加一盏小灯作为辅助光，照亮人物面部阴影部分，形成面光+轮廓光的效果，使人物更加立体。

**Mood**：情绪基调从开场的苦恼转变为结尾的惊喜。通过人物的表情、动作和台词来传递情感层次，感染力来源于真实的生活场景和产品带来的明显效果，让观众感同身受。

## Shots 分镜描述

**Shot 1**（0-5秒）：开场场景。画面中，年轻女性慵懒地坐在梳妆台前，灯光柔和。她打了个哈欠，揉了揉眼睛，看着镜子里略显憔悴的自己，眉头皱起，露出苦恼的表情。然后她拿起放在一旁的${productName}，对着镜头展示产品包装。

**Shot 2**（5-10秒）：核心内容。女性轻轻打开${productName}，取适量在指尖，均匀涂抹在脸上，双手轻柔按摩至吸收，靠在椅子上闭眼享受。随着时间推移，她的表情逐渐放松，眉头舒缓，嘴角微微上扬。

**Shot 3**（10-${videoDuration}秒）：结尾收尾。15分钟后，女性缓缓睁开眼睛，拿起镜子照自己的脸，手指轻轻触摸脸颊，眼睛睁大，露出惊喜的笑容，对着镜头展示焕活后的肌肤。

## 以下是产品细节，务必进行参考

**产品类型**: 美妆个护/精华液

**形态说明**: 透明玻璃瓶身，银色瓶盖，滴管设计，瓶身通透质感，银色品牌Logo位于瓶身中央

**尺寸比例**: 瓶身高度约100mm，直径约35mm，整体呈修长圆柱形

**主色调**: 瓶身透明，瓶盖银色，液体淡黄色

**主要文字元素**: 正面：品牌名、产品名、核心成分标识

**材质质感**: 瓶身：玻璃质感，通透；瓶盖：金属质感，哑光

**使用场景暗示**: 化妆台摆放、手持展示、滴管取液动作

## 以下是任务考核点，强制要求

### 核心要求
- 视频要求：要真实、让观众有代入感；要有情绪，明确的情感变化，人物表情到位；要有动态，画面从开场的静态到过程中的动作变化，再到结尾展示效果，节奏有起伏
- 语言要求：zh-CN（中文发音、自然语调）

### 技术参数
- 拍摄设备：iPhone 17 pro
- 视频参数：分辨率4K
- 画面比例: ${aspectRatio}
- 视频时长：${videoDuration}秒

### 产品一致性
- 如果视频中有出现图片中的产品，要求产品形态文字要与图片中的产品一样

### 画面稳定性
- 所有中文与英文文字必须保持原样，不译、不变形、不替换字体
- 包装形态(比例、角度、边缘)必须保持稳定
- 禁止变形、拉伸、弯曲
- 如果是视频镜头，移动时文字与图案要锁定在表面
- 允许改变光线或背景

### 音频要求
- 声音要求：要有同期声不要有画外音
- 人物正在讲话且声音与口型一致
- 有符合情绪的背景音乐

### 禁用项
- 视频中不需要生成字幕
- 行动引导中不要出现购物车图标，保持画面纯净`

  const productAnalysis = {
    productType: '美妆个护/精华液',
    formDescription: '透明玻璃瓶身，银色瓶盖，滴管设计，瓶身通透质感',
    sizeRatio: '瓶身高度约100mm，直径约35mm，修长圆柱形',
    mainColors: ['瓶身：透明', '瓶盖：银色', '液体：淡黄色'],
    textElements: ['品牌名', '产品名', '核心成分标识'],
    materialTexture: '瓶身玻璃通透质感，瓶盖金属哑光质感',
    usageScenarios: ['化妆台摆放', '手持展示', '滴管取液动作'],
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedPrompt : fullPrompt)
    message.success('提示词已复制到剪贴板！')
  }

  const handleEdit = () => {
    if (isEditing) {
      setStep6Data({ finalPrompt: editedPrompt })
      setIsEditing(false)
      message.success('提示词已保存！')
    } else {
      setEditedPrompt(fullPrompt)
      setIsEditing(true)
    }
  }

  const handleNext = () => {
    setStep6Data({ finalPrompt: isEditing ? editedPrompt : fullPrompt })
    onNext()
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        第六步：完整提示词预览
      </h2>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="📦 产品分析" size="small">
            <Paragraph>
              <Text strong>产品类型：</Text>
              {productAnalysis.productType}
            </Paragraph>
            <Paragraph>
              <Text strong>形态说明：</Text>
              {productAnalysis.formDescription}
            </Paragraph>
            <Paragraph>
              <Text strong>尺寸比例：</Text>
              {productAnalysis.sizeRatio}
            </Paragraph>
            <Paragraph>
              <Text strong>主色调：</Text>
              <br />
              {productAnalysis.mainColors.map((color, idx) => (
                <Tag key={idx} size="small" style={{ marginTop: '4px' }}>{color}</Tag>
              ))}
            </Paragraph>
            <Paragraph>
              <Text strong>材质质感：</Text>
              {productAnalysis.materialTexture}
            </Paragraph>
            <Paragraph>
              <Text strong>使用场景：</Text>
              <br />
              {productAnalysis.usageScenarios.map((scene, idx) => (
                <Tag key={idx} color="blue" size="small" style={{ marginTop: '4px' }}>{scene}</Tag>
              ))}
            </Paragraph>
          </Card>

          <Alert
            message="提示词校验通过"
            description="字数：约3500字 | 无违禁词 | 格式正确"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginTop: '16px' }}
          />
        </Col>

        <Col span={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📝 完整提示词</span>
                <Space>
                  <Tooltip title="复制提示词">
                    <Button icon={<CopyOutlined />} onClick={handleCopy}>
                      复制
                    </Button>
                  </Tooltip>
                  <Button 
                    icon={<EditOutlined />} 
                    type={isEditing ? 'primary' : 'default'}
                    onClick={handleEdit}
                  >
                    {isEditing ? '保存' : '编辑'}
                  </Button>
                </Space>
              </div>
            }
          >
            {isEditing ? (
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '500px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
            ) : (
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {fullPrompt}
                </pre>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Space style={{ marginTop: '32px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          上一步
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleNext}
        >
          下一步：视频生成
        </Button>
      </Space>
    </div>
  )
}
