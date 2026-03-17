// 测试新的扣子 API 调用
const https = require('https');

const config = {
  endpoint: 'https://99qq4r5gbs.coze.site/stream_run',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkxNV3ZQVkdRTG9WTnpGZURaN3dFZTdrOVA4MGxRWmQwIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjYxNzI0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE3NzkzMjk3Mzk3ODQxOTU4Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3ODE5MTAyNTQ3MDE3Nzc0In0.cfv_Avmpr-9U88OvDRZq9znZqXeQCWTmoWEd61q3bLF-R_K0jMba1jB-dLo955uIzQjUZLhovDmhb_g-TDZR_AdKl90xUYVx0cHR2sP_eZFE0Wu0Xzyt1Y-V2w97bbiHvMmJ_fSU9m1SzLhUbHJ_hPNLW4NCLdOHoVqRIf1c5KkEq8teJCuaCpknZ5VBacKrnyDzRgP1URC5maDH1y57WQU_j747w45d37CLoAhC0fairya9FAWBMqYpjXgGLOoVSpKlkVVrqg3NKjaLJvHQAym7WVmSfCxwfpmtfqmvQK98xts1zTT4QBVMXbs_B_gXxReuDEgExdf1tbDQs7pgYw',
  projectId: '7617792689441964078',
};

const requestBody = {
  content: {
    query: {
      prompt: [
        {
          type: 'text',
          content: {
            text: '请根据以下商品信息，提供详细的产品调研报告：\n\n商品名称：光感美白精华液\n\n请提供以下信息：\n1. 基本信息：规格、参数、价格、适用人群\n2. 核心技术：产品采用的技术/成分\n3. 核心功效：产品的主要功效\n4. 解决痛点：产品解决的用户痛点\n5. 产品外观细节：\n   - 形态说明（外观描述，如：圆柱形瓶身、方形盒子等）\n   - 尺寸比例（如：高度10cm，直径3cm）\n   - 主色调（如：香槟金、玫瑰粉、纯白色）\n   - 主要文字元素（如：品牌名、产品名、容量标识）\n   - 材质质感（如：磨砂玻璃、亮面金属、哑光塑料）\n   - 使用场景暗示（如：便携小巧适合随身携带）\n\n请以JSON格式返回，便于程序解析。',
          },
        },
      ],
    },
  },
  type: 'query',
  session_id: 'test-session-123',
  project_id: parseInt(config.projectId, 10),
};

console.log('Testing new API...');
console.log('Request URL:', config.endpoint);
console.log('Request Body:', JSON.stringify(requestBody, null, 2));

const url = new URL(config.endpoint);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== Full Response ===');
    console.log(data);
    
    // 解析 SSE 数据
    const lines = data.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('\nParsed event:', parsed.type);
          if (parsed.content?.answer) {
            console.log('Answer:', parsed.content.answer.substring(0, 200));
          }
          if (parsed.content?.error) {
            console.log('Error:', parsed.content.error);
          }
        } catch (e) {
          // 不是 JSON，忽略
        }
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(JSON.stringify(requestBody));
req.end();
