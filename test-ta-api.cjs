// 测试 TA 画像 API
const https = require('https');

const config = {
  endpoint: 'https://khj28pmb4y.coze.site/stream_run',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInNIR0dINE9WdGdLVnpvbnl6QXBnZlhDbUZiT0QyaUpMIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjYxNjU0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE3ODA1Mjc5MjI4MzMwMDExIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3ODE4ODAyMTE3NDEwODUyIn0.sr7cRTb6gqkqen1Z8u8SsGkcfPa94npNnDATRyYjy6Qpl0JTerQceUxRm3cMyoyRiqTchK2Sc-m5Gs6ANOGXDP30vxr4tyPcOtQnmKjRqULMEuLQ2_q781xn__gX-VlxjyzRPwXE8IftqHci-aXMTWpbW4_fkCKd8u-Oju7acM0d31q4hqZ7Kh5f3WJLOfSo2osa7CMzEKXEdSPJ8fS8ISWb5MSgQkRizHavVKRNJWjKDVRJfq4sQ58O-5Cqsvh3VpKV5ajYMa7SKX4aVyVVwnuvF1xY-WQf55ghDlG3RNK-B2Q2PGqHgSIryrsHoJu83WG22aNydx5MNYMSYLz8tg',
  projectId: '7617799487003607050',
};

const prompt = `请根据以下商品名称，进行舆情调研并推理TA画像，并以JSON格式返回。

商品名称：光感美白精华液

请提供以下信息，并以JSON格式返回：
{
  "taProfiles": [
    {
      "id": "ta1",
      "name": "TA名称",
      "age": "年龄段",
      "skinType": "肤质/特征",
      "painPoints": ["痛点1", "痛点2"],
      "scenes": ["使用场景1", "使用场景2"],
      "motivation": "消费动机"
    }
  ]
}

请提供4个不同的TA画像，确保返回的是合法的JSON格式，不要包含任何其他文本。`;

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
  session_id: 'test-ta-session',
  project_id: parseInt(config.projectId, 10),
};

console.log('Testing TA API...');

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
        console.log('\n=== TA Profiles ===');
        console.log('taProfiles:', data.taProfiles ? data.taProfiles.length : 'not found');
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
