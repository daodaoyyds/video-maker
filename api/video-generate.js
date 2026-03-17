// Vercel API Route - 视频生成代理
// 解决 Cloudsway API 的 CORS 问题

const API_KEY = 'C3GxBl02Wh5nlP6ypAQN'
const ENDPOINT = 'https://genaiapi.cloudsway.net/v1/ai/kvWjKjkVWRnDbOFw'

export default async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

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
    const { prompt, size, seconds } = req.body

    if (!prompt || !size || !seconds) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing required fields: prompt, size, seconds' }))
      return
    }

    // 使用 FormData 格式调用 Cloudsway API
    const formData = new URLSearchParams()
    formData.append('prompt', prompt)
    formData.append('size', size)
    formData.append('seconds', seconds)

    const response = await fetch(`${ENDPOINT}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudsway API error:', response.status, errorText)
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        error: 'Video generation failed',
        details: errorText
      }))
      return
    }

    const data = await response.json()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))

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
