// 测试扣子 API 调用 - 要求返回 JSON
const https = require('https');

const config = {
  endpoint: 'https://99qq4r5gbs.coze.site/stream_run',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkxNV3ZQVkdRTG9WTnpGZURaN3dFZTdrOVA4MGxRWmQwIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjYxNzI0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE3NzkzMjk3Mzk3ODQxOTU4Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3ODE5MTAyNTQ3MDE3Nzc0In0.cfv_Avmpr-9U88OvDRZq9znZqXeQCWTmoWEd61q3bLF-R_K0jMba1jB-dLo955uIzQjUZLhovDmhb_g-TDZR_AdKl90xUYVx0cHR2sP_eZFE0Wu0Xzyt1Y-V2w97bbiHvMmJ_fSU9m1SzLhUbHJ_hPNLW4NCLdOHoVqRIf1c5KkEq8teJCuaCpknZ5VBacKrnyDzRgP1URC5maDH1y57WQU_j747w45d37CLoAhC0fairya9FAWBMqYpjXgGLOoVSpKlkVVrqg3NKjaLJvHQAym7WVmSfCxwfpmtfqmvQK98xts1zTT4QBVMXbs_B_gXxReuDEgExdf1tbDQs7pgYw',
  projectId: '7617792689441964078',
};

const prompt = `请根据以下商品信息，提供详细的产品调研报告，并以JSON格式返回。

商品名称：光感美白精华液

请提供以下信息，并以JSON格式返回：
{
  "basicInfo": "规格、参数、价格、适用人群",
  "coreTech": "产品采用的技术/成分",
  "coreBenefits": "产品的主要功效",
  "painPoints": "产品解决的用户痛点",
  "formDescription": "外观描述，如：圆柱形瓶身、方形盒子等",
  "sizeRatio": "尺寸比例，如：高度10cm，直径3cm",
  "mainColors": ["主色调1", "主色调2"],
  "textElements": ["文字元素1", "文字元素2"],
  "materialTexture": "材质质感描述",
  "usageScenarios": ["使用场景1", "使用场景2"]
}

请确保返回的是合法的JSON格式，不要包含任何其他文本。`;

const requestBody = {
  content: {
    query: {
      prompt: [
        {
          type: 'text',
          content: {
            text: prompt,
          },
        },
      ],
    },
  },
  type: 'query',
  session_id: 'test-session-json',
  project_id: parseInt(config.projectId, 10),
};

console.log('Testing JSON API...');

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

let fullAnswer = '';

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  
  res.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'answer' && parsed.content?.answer) {
            fullAnswer += parsed.content.answer;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  });
  
  res.on('end', () => {
    console.log('\n=== Full Answer ===');
    console.log(fullAnswer);
    
    // 尝试解析 JSON
    try {
      const jsonMatch = fullAnswer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        console.log('\n=== Parsed JSON ===');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('\nNo JSON found in response');
      }
    } catch (e) {
      console.log('\nFailed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(JSON.stringify(requestBody));
req.end();
