import { Layout, Steps, theme } from 'antd'
import { useState } from 'react'
import Step1BasicInfo from './pages/Step1BasicInfo'
import Step2ProductResearch from './pages/Step2ProductResearch'
import Step3ScriptProposal from './pages/Step3ScriptProposal'
import Step4ScriptDetail from './pages/Step4ScriptDetail'
import Step5EnhancedScript from './pages/Step5EnhancedScript'
import Step6PromptPreview from './pages/Step6PromptPreview'
import Step7VideoResult from './pages/Step7VideoResult'

const { Header, Content } = Layout

const steps = [
  { title: '基础信息', description: '输入商品信息' },
  { title: '产品调研', description: 'AI分析产品' },
  { title: '脚本提案', description: '生成创意脚本' },
  { title: '脚本详情', description: '查看脚本内容' },
  { title: '脚本增强', description: '优化拍摄方案' },
  { title: '提示词预览', description: '生成完整提示词' },
  { title: '视频生成', description: '生成最终视频' },
]

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    const stepProps = { onNext: nextStep, onPrev: prevStep }
    
    switch (currentStep) {
      case 0:
        return <Step1BasicInfo {...stepProps} />
      case 1:
        return <Step2ProductResearch {...stepProps} />
      case 2:
        return <Step3ScriptProposal {...stepProps} />
      case 3:
        return <Step4ScriptDetail {...stepProps} />
      case 4:
        return <Step5EnhancedScript {...stepProps} />
      case 5:
        return <Step6PromptPreview {...stepProps} />
      case 6:
        return <Step7VideoResult {...stepProps} />
      default:
        return <Step1BasicInfo {...stepProps} />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: colorBgContainer, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          🎬 AI视频生成器
        </h1>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ 
          background: colorBgContainer, 
          padding: '24px',
          borderRadius: borderRadiusLG,
          marginBottom: '24px'
        }}>
          <Steps 
            current={currentStep} 
            items={steps}
            size="small"
            responsive
          />
        </div>
        
        <div style={{ 
          background: colorBgContainer, 
          padding: '24px',
          borderRadius: borderRadiusLG,
          minHeight: '500px'
        }}>
          {renderStepContent()}
        </div>
      </Content>
    </Layout>
  )
}

export default App
