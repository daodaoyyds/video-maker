// Vercel API Route - 视频状态查询代理

const API_KEY = 'C3GxBl02Wh5nlP6ypAQN'
const ENDPOINT = 'https://genaiapi.cloudsway.net/v1/ai/kvWjKjkVWRnDbOFw'

export default async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const { videoId } = req.query

    if (!videoId) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing required parameter: videoId' }))
      return
    }

    // 调用 Cloudsway API
    const response = await fetch(`${ENDPOINT}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudsway API error:', response.status, errorText)
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        error: 'Status query failed',
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
