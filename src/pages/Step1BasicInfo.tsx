import { useState } from 'react'
import { Form, Input, Upload, Radio, Button, Space, message } from 'antd'
import { UploadOutlined, ArrowRightOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useProjectStore } from '../stores/projectStore'

interface Step1Props {
  onNext: () => void
  onPrev: () => void
}

const durationOptions = [
  { label: '15秒', value: 15 },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 },
]

const aspectRatioOptions = [
  { label: '9:16 竖屏', value: '9:16' },
  { label: '16:9 横屏', value: '16:9' },
  { label: '1:1 方形', value: '1:1' },
]

export default function Step1BasicInfo({ onNext }: Step1Props) {
  const [form] = Form.useForm()
  const { productName, productImage, videoDuration, aspectRatio, setStep1Data } = useProjectStore()
  const [imageUrl, setImageUrl] = useState<string | null>(productImage)
  const [loading, setLoading] = useState(false)

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload', // 后续替换为实际上传接口
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件！')
        return false
      }
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('图片大小不能超过5MB！')
        return false
      }
      return true
    },
    onChange: (info) => {
      if (info.file.status === 'uploading') {
        setLoading(true)
        return
      }
      if (info.file.status === 'done') {
        // 实际项目中这里获取服务器返回的图片URL
        // 现在先用本地预览
        const reader = new FileReader()
        reader.readAsDataURL(info.file.originFileObj as File)
        reader.onload = () => {
          setImageUrl(reader.result as string)
          setLoading(false)
          message.success('图片上传成功！')
        }
      }
    },
    customRequest: ({ file, onSuccess }) => {
      // 模拟上传，实际项目中替换为真实上传逻辑
      setTimeout(() => {
        const reader = new FileReader()
        reader.readAsDataURL(file as File)
        reader.onload = () => {
          setImageUrl(reader.result as string)
          onSuccess?.('ok')
        }
      }, 500)
    },
  }

  const handleNext = async () => {
    try {
      const values = await form.validateFields()
      
      // 开发阶段：如果没有图片，使用默认占位图
      const finalImageUrl = imageUrl || 'https://via.placeholder.com/300x300?text=Product+Image'
      
      setStep1Data({
        productName: values.productName,
        productImage: finalImageUrl,
        videoDuration: values.videoDuration,
        aspectRatio: values.aspectRatio,
      })
      
      onNext()
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>
        第一步：输入基础信息
      </h2>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          productName,
          videoDuration,
          aspectRatio,
        }}
        style={{ maxWidth: '600px' }}
      >
        <Form.Item
          label="商品名称"
          name="productName"
          rules={[{ required: true, message: '请输入商品名称' }]}
          extra="视频中如何称呼产品，例如：光感美白精华液"
        >
          <Input placeholder="请输入商品名称" size="large" />
        </Form.Item>

        <Form.Item
          label="产品图片"
          required
          extra="请上传清晰的产品图片，支持 JPG、PNG 格式，大小不超过5MB"
        >
          <Upload.Dragger {...uploadProps} style={{ width: '100%' }}>
            {imageUrl ? (
              <div style={{ padding: '20px' }}>
                <img
                  src={imageUrl}
                  alt="产品图片"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                />
                <p style={{ marginTop: '10px', color: '#666' }}>
                  点击或拖拽更换图片
                </p>
              </div>
            ) : (
              <div style={{ padding: '40px' }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">点击或拖拽上传产品图片</p>
                <p className="ant-upload-hint">
                  支持 JPG、PNG 格式，大小不超过5MB
                </p>
              </div>
            )}
          </Upload.Dragger>
        </Form.Item>

        <Form.Item
          label="视频时长"
          name="videoDuration"
          rules={[{ required: true, message: '请选择视频时长' }]}
        >
          <Radio.Group options={durationOptions} optionType="button" buttonStyle="solid" />
        </Form.Item>

        <Form.Item
          label="画面比例"
          name="aspectRatio"
          rules={[{ required: true, message: '请选择画面比例' }]}
        >
          <Radio.Group options={aspectRatioOptions} optionType="button" buttonStyle="solid" />
        </Form.Item>

        <Form.Item style={{ marginTop: '40px' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleNext}
            >
              下一步：开始产品调研
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
