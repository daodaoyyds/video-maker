# 扣子智能体 API 文档

## 基础信息

### API 端点
```
POST https://bcyhkv8qr9.coze.site/stream_run
```

> 注意：不同 agent 使用不同的 endpoint

### 认证方式
**Header: Authorization**
```
Authorization: Bearer <YOUR_TOKEN>
```

> Token 需从扣子平台获取，每个智能体有独立的 Token

---

## 请求参数

### Headers
| 参数 | 值 | 说明 |
|------|-----|------|
| Authorization | Bearer {token} | API Token 鉴权 |
| Content-Type | application/json | 请求体格式 |
| Accept | text/event-stream | 流式响应 |

### Body (JSON)
```json
{
  "content": {
    "query": {
      "prompt": [
        {
          "type": "text",
          "content": {
            "text": "用户输入的文本内容"
          }
        }
      ]
    }
  },
  "type": "query",
  "session_id": "ydQc1sx7lqqmza4XcsCku",
  "project_id": "7616737971588562994"
}
```

### 字段说明
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content.query.prompt | array | ✅ | 输入提示词数组 |
| content.query.prompt[].type | string | ✅ | 类型：text |
| content.query.prompt[].content.text | string | ✅ | 输入的文本内容 |
| type | string | ✅ | 固定值：query |
| session_id | string | ✅ | 会话 ID，保持上下文 |
| project_id | string | ✅ | 项目 ID |

---

## 响应参数（流式 SSE）

### 事件类型

#### 1. message_start 事件
```json
{
  "event": "message_start",
  "data": {
    "type": "message_start",
    "content": {
      "local_msg_id": "客户端消息ID",
      "msg_id": "服务端消息ID"
    }
  }
}
```

#### 2. answer 事件（核心）
```json
{
  "event": "message",
  "data": {
    "type": "answer",
    "content": {
      "answer": "最终回复内容增量"
    }
  }
}
```

#### 3. tool_request 事件
```json
{
  "event": "message",
  "data": {
    "type": "tool_request",
    "content": {
      "tool_request": {
        "tool_call_id": "工具调用ID",
        "tool_name": "工具名称",
        "parameters": {},
        "is_parallel": false,
        "index": 0,
        "stream_parameters": "流式工具参数"
      }
    }
  }
}
```

#### 4. tool_response 事件
```json
{
  "event": "message",
  "data": {
    "type": "tool_response",
    "content": {
      "tool_response": {
        "tool_call_id": "工具调用ID",
        "code": "返回码",
        "message": "返回信息",
        "result": "工具结果",
        "time_cost_ms": 0,
        "tool_name": "工具名称"
      }
    }
  }
}
```

#### 5. message_end 事件
```json
{
  "event": "message",
  "data": {
    "type": "message_end",
    "content": {
      "code": 0,
      "message": "结束信息",
      "token_cost": {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0
      },
      "time_cost_ms": 0
    }
  }
}
```

#### 6. error 事件
```json
{
  "event": "message",
  "data": {
    "type": "error",
    "content": {
      "local_msg_id": "客户端消息ID",
      "code": 105002,
      "error_msg": "错误描述"
    }
  }
}
```

---

## 调用示例

### cURL
```bash
curl --location --request POST "https://bcyhkv8qr9.coze.site/stream_run" \
  --header "Authorization: Bearer <YOUR_TOKEN>" \
  --header "Content-Type: application/json" \
  --data '{
    "content": {
      "query": {
        "prompt": [
          {
            "type": "text",
            "content": {
              "text": "你好"
            }
          }
        ]
      }
    },
    "type": "query",
    "session_id":"ydQc1sx7lqqmza4XcsCku",
    "project_id": "7616737971588562994"
  }'
```

### Python
```python
import json
import requests

url = "https://bcyhkv8qr9.coze.site/stream_run"
headers = {
    "Authorization": "Bearer <YOUR_TOKEN>",
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
}
payload = {
    "content": {
        "query": {
            "prompt": [
                {
                    "type": "text",
                    "content": {
                        "text": ""
                    }
                }
            ]
        }
    },
    "type": "query",
    "session_id": "yxh9DRZnt1mbyHeuZ2hV8",
    "project_id": "7616737971588562994"
}

response = requests.post(url, headers=headers, json=payload, stream=True)
print("status:", response.status_code)

try:
    response.raise_for_status()
except Exception:
    print(response.text)
    raise

for line in response.iter_lines(decode_unicode=True):
    if line and line.startswith("data:"):
        data_text = line[5:].strip()
        try:
            parsed = json.loads(data_text)
            print(json.dumps(parsed, ensure_ascii=False, indent=2))
        except Exception:
            print(data_text)
```

### Node.js
```javascript
async function callCozeAgent(text, token, sessionId, projectId) {
  const url = "https://bcyhkv8qr9.coze.site/stream_run";
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      "content": {
        "query": {
          "prompt": [{
            "type": "text",
            "content": { "text": text }
          }]
        }
      },
      "type": "query",
      "session_id": sessionId,
      "project_id": projectId
    })
  });
  
  console.log("status:", res.status);
  if (!res.ok) {
    const errText = await res.text();
    console.log(errText);
    return null;
  }
  
  if (!res.body) {
    console.log("No response body");
    return null;
  }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    
    for (const block of blocks) {
      const dataLines = block
        .split("\n")
        .filter(line => line.startsWith("data:"))
        .map(line => line.slice(5).trim());
      
      if (dataLines.length === 0) continue;
      const dataText = dataLines.join("\n");
      
      try {
        const parsed = JSON.parse(dataText);
        // 处理 answer 事件
        if (parsed.data?.type === 'answer') {
          fullAnswer += parsed.data.content.answer;
        }
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(dataText);
      }
    }
  }
  
  return fullAnswer;
}
```

---

## 智能体配置

### 需要配置的参数
每个智能体需要以下信息：

1. **API Endpoint** - 智能体的调用地址
2. **API Token** - 鉴权令牌
3. **Project ID** - 项目 ID
4. **Session ID** - 会话 ID（保持上下文）

### 当前项目的智能体列表

| 智能体 | 功能 | 步骤 | Endpoint | Token |
|--------|------|------|----------|-------|
| 智能体1 | 产品调研 | Step 2 | 待配置 | 待配置 |
| 智能体2 | 脚本生成 | Step 3 | 待配置 | 待配置 |
| 智能体3 | 脚本增强 | Step 5 | 待配置 | 待配置 |
| 智能体4 | 提示词组装 | Step 6 | 待配置 | 待配置 |
| 智能体5 | 视频生成 | Step 7 | 待配置 | 待配置 |

---

## 接入计划

### Phase 1: 基础 API 封装
- [ ] 创建 `src/api/coze.ts` 封装 API 调用
- [ ] 实现流式响应处理
- [ ] 错误处理机制

### Phase 2: 智能体对接
- [ ] Step 2: 产品调研智能体
- [ ] Step 3: 脚本生成智能体
- [ ] Step 5: 脚本增强智能体
- [ ] Step 6: 提示词组装智能体
- [ ] Step 7: 视频生成智能体

### Phase 3: UI 优化
- [ ] 加载状态显示
- [ ] 流式输出展示
- [ ] 错误提示

---

## 注意事项

1. **Session ID**: 需要保持会话上下文，每个用户的 session_id 应该唯一
2. **流式响应**: 使用 SSE (Server-Sent Events) 格式，需要逐行解析
3. **Token 安全**: API Token 不应暴露在客户端代码中，建议通过环境变量或后端代理
4. **错误处理**: 需要处理网络错误、超时、API 错误等情况
