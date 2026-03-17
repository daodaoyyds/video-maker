// Vercel Edge Function - 代理扣子 API 请求
// 解决前端 CORS 问题

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { endpoint, token, projectId, sessionId, text } = body;

    if (!endpoint || !token) {
      return new Response(JSON.stringify({ error: 'Missing endpoint or token' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // 构建请求体
    const requestBody = {
      content: {
        query: {
          prompt: [
            {
              type: 'text',
              content: {
                text: text,
              },
            },
          ],
        },
      },
      type: 'query',
      session_id: sessionId,
      project_id: projectId ? parseInt(projectId, 10) : undefined,
    };
    
    // 记录请求日志到文件
    const fs = require('fs');
    const logDir = '/tmp/coze-logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = `${logDir}/coze-request-${timestamp}.log`;
    
    fs.appendFileSync(logFile, `=== REQUEST ===\n`);
    fs.appendFileSync(logFile, `Endpoint: ${endpoint}\n`);
    fs.appendFileSync(logFile, `ProjectId: ${projectId}\n`);
    fs.appendFileSync(logFile, `TextLength: ${text.length}\n`);
    fs.appendFileSync(logFile, `RequestBody: ${JSON.stringify(requestBody, null, 2)}\n\n`);

    // 转发请求到扣子 API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    // 检查响应
    if (!response.ok) {
      const errorText = await response.text();
      fs.appendFileSync(logFile, `=== ERROR ===\n`);
      fs.appendFileSync(logFile, `Status: ${response.status}\n`);
      fs.appendFileSync(logFile, `Error: ${errorText}\n\n`);
      return new Response(JSON.stringify({ error: `HTTP ${response.status}: ${errorText}` }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
    
    fs.appendFileSync(logFile, `=== SUCCESS ===\n`);
    fs.appendFileSync(logFile, `Status: ${response.status}\n\n`);

    // 流式返回响应
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}
