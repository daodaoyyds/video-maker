/**
 * Vercel API Route - 视频生成代理
 * 解决 Cloudsway API 的 CORS 问题
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_KEY = 'C3GxBl02Wh5nlP6ypAQN'
const ENDPOINT = 'https://genaiapi.cloudsway.net/v1/ai/kvWjKjkVWRnDbOFw'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, size, seconds } = req.body

    if (!prompt || !size || !seconds) {
      return res.status(400).json({ error: 'Missing required fields: prompt, size, seconds' })
    }

    // 调用 Cloudsway API
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('size', size)
    formData.append('seconds', seconds)

    const response = await fetch(`${ENDPOINT}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudsway API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Video generation failed', 
        details: errorText 
      })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error: any) {
    console.error('Proxy error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}
