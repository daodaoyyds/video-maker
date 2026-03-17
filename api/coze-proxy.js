// Vercel Serverless Function - 代理扣子 API 请求
// 解决前端 CORS 问题

export default async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const { endpoint, token, projectId, sessionId, text } = req.body

    if (!endpoint || !token) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing endpoint or token' }))
      return
    }

    // 构建请求体（扣子标准格式）
    const requestBody = {
      content: {
        query: {
          prompt: [
            {
              type: 'text',
              content: {
                text: text
              }
            }
          ]
        }
      },
      type: 'query',
      session_id: sessionId,
      project_id: projectId
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
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        error: 'Coze API request failed',
        details: errorText
      }))
      return
    }

    // 流式返回响应
    const reader = response.body?.getReader()
    if (!reader) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'No response body' }))
      return
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

  } catch (error) {
    console.error('Proxy error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }))
  }
}
