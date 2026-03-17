/**
 * Vercel Serverless Function - 代理扣子 API 请求
 * 解决前端 CORS 问题
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { endpoint, token, projectId, sessionId, text } = req.body

    if (!endpoint || !token) {
      return res.status(400).json({ error: 'Missing endpoint or token' })
    }

    // 构建请求体
    const requestBody = {
      content: {
        query: {
          prompt: [
            {
              role: 'user',
              type: 'query',
              content: text,
              content_type: 'text'
            }
          ]
        },
        bot_id: projectId,
        conversation_id: sessionId,
        user: 'user'
      }
    }

    // 调用扣子 API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Coze API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Coze API request failed', 
        details: errorText 
      })
    }

    // 流式返回响应
    const reader = response.body?.getReader()
    if (!reader) {
      return res.status(500).json({ error: 'No response body' })
    }

    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // 读取并转发流数据
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }

    res.end()

  } catch (error: any) {
    console.error('Proxy error:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    })
  }
}
