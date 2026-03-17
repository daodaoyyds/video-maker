/**
 * Cloudsway 视频生成 API 封装（通过 Vercel 代理）
 * 文档: https://docs.cloudsway.net/zh/maasapi/api-reference/video/Sora/
 */

// 使用 Vercel API 代理，避免 CORS 问题
const PROXY_ENDPOINT = '/api'

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
 * POST /api/video-generate
 */
export async function generateVideo(request: GenerateVideoRequest): Promise<string> {
  const response = await fetch(`${PROXY_ENDPOINT}/video-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `生成视频失败: ${response.status}`)
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
 * GET /api/video-status?videoId={id}
 */
export async function queryVideoStatus(videoId: string): Promise<VideoStatus> {
  const response = await fetch(`${PROXY_ENDPOINT}/video-status?videoId=${encodeURIComponent(videoId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `查询状态失败: ${response.status}`)
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
 * GET /api/video-download?videoId={id}
 */
export async function getVideoDownloadUrl(videoId: string): Promise<string> {
  // 返回代理下载URL
  return `${PROXY_ENDPOINT}/video-download?videoId=${encodeURIComponent(videoId)}`
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
 * 将秒数限制在 API 支持的范围内 (15-25秒)
 */
export function clampDuration(duration: number): number {
  return Math.min(Math.max(duration, 15), 25)
}
