/**
 * Vercel API Route - 视频下载代理
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_KEY = 'C3GxBl02Wh5nlP6ypAQN'
const ENDPOINT = 'https://genaiapi.cloudsway.net/v1/ai/kvWjKjkVWRnDbOFw'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { videoId } = req.query

    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: videoId' })
    }

    // 调用 Cloudsway API
    const response = await fetch(`${ENDPOINT}/videos/${videoId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudsway API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Download failed', 
        details: errorText 
      })
    }

    // 获取视频流并转发
    const contentType = response.headers.get('content-type') || 'video/mp4'
    const buffer = await response.arrayBuffer()
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="video_${videoId}.mp4"`)
    return res.send(Buffer.from(buffer))

  } catch (error: any) {
    console.error('Proxy error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}
