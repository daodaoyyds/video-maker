/**
 * Cloudsway 视频生成 API 封装
 * 文档: https://docs.cloudsway.net/zh/maasapi/api-reference/video/Sora/
 */

const API_KEY = 'C3GxBl02Wh5nlP6ypAQN'
const ENDPOINT = 'https://genaiapi.cloudsway.net/v1/ai/kvWjKjkVWRnDbOFw'

export interface GenerateVideoRequest {
  prompt: string
  size: string  // e.g., "1280x720"
  seconds: string  // e.g., "12"
}

export interface VideoStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  url?: string
  error?: string
}

/**
 * Step 1: 生成视频任务
 * POST /videos
 */
export async function generateVideo(request: GenerateVideoRequest): Promise<string> {
  const formData = new FormData()
  formData.append('prompt', request.prompt)
  formData.append('size', request.size)
  formData.append('seconds', request.seconds)

  const response = await fetch(`${ENDPOINT}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`生成视频失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  // 返回视频 ID
  if (data.id) {
    return data.id
  }
  
  throw new Error('未获取到视频ID')
}

/**
 * Step 2: 查询视频状态
 * GET /videos/{video_id}
 */
export async function queryVideoStatus(videoId: string): Promise<VideoStatus> {
  const response = await fetch(`${ENDPOINT}/videos/${videoId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`查询状态失败: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  return {
    id: videoId,
    status: data.status || 'pending',
    url: data.url,
    error: data.error,
  }
}

/**
 * Step 3: 下载视频
 * GET /videos/{video_id}/content
 */
export async function getVideoDownloadUrl(videoId: string): Promise<string> {
  // 返回下载URL，实际下载由前端处理
  return `${ENDPOINT}/videos/${videoId}/content`
}

/**
 * 轮询等待视频生成完成
 */
export async function waitForVideoCompletion(
  videoId: string,
  onProgress?: (status: VideoStatus, attempt: number) => void,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<VideoStatus> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await queryVideoStatus(videoId)
    
    onProgress?.(status, attempt)
    
    if (status.status === 'completed') {
      return status
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error || '视频生成失败')
    }
    
    // 等待后继续查询
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  throw new Error('等待超时，请稍后手动查询')
}

/**
 * 将比例转换为尺寸
 * 9:16 -> 720x1280
 * 1:1 -> 1024x1024
 * 16:9 -> 1280x720
 */
export function aspectRatioToSize(ratio: string): string {
  switch (ratio) {
    case '9:16':
      return '720x1280'
    case '1:1':
      return '1024x1024'
    case '16:9':
    default:
      return '1280x720'
  }
}

/**
 * 将秒数限制在 API 支持的范围内 (5-12秒)
 */
export function clampDuration(duration: number): number {
  return Math.min(Math.max(duration, 5), 12)
}
