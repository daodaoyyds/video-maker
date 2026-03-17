// 开发服务器 - 提供 API 路由支持
import http from 'http'
import { parse } from 'url'
import cozeProxy from './api/coze-proxy.js'
import videoGenerate from './api/video-generate.js'
import videoStatus from './api/video-status.js'
import videoDownload from './api/video-download.js'

const PORT = 3001

const handlers = {
  '/api/coze-proxy': cozeProxy,
  '/api/video-generate': videoGenerate,
  '/api/video-status': videoStatus,
  '/api/video-download': videoDownload,
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true)
  const pathname = parsedUrl.pathname

  console.log(`${req.method} ${pathname}`)

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  // 解析请求体
  let body = ''
  if (req.method === 'POST') {
    for await (const chunk of req) {
      body += chunk
    }
    try {
      req.body = JSON.parse(body)
    } catch {
      req.body = {}
    }
  }

  // 解析查询参数
  req.query = parsedUrl.query

  // 找到对应的 handler
  const handler = handlers[pathname]
  if (handler) {
    try {
      await handler(req, res)
    } catch (err) {
      console.error('Handler error:', err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message }))
    }
  } else {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log('Available endpoints:')
  Object.keys(handlers).forEach(path => console.log(`  - ${path}`))
})
