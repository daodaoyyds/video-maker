# 扣子智能体 API 文档

## 已配置的智能体

| 智能体 | 功能 | Endpoint | Project ID | 状态 |
|--------|------|----------|------------|------|
| productResearch | 产品调研 | 99qq4r5gbs.coze.site | 7617792689441964078 | ✅ 已对接 |
| taResearch | TA画像 | khj28pmb4y.coze.site | 7617799487003607050 | ✅ 已对接 |
| scriptProposal | 脚本提案 | k82jhyg2v9.coze.site | 7617815009057357875 | ✅ 已对接 |
| scriptGeneration | 剧情脚本 | 6wggt3vv54.coze.site | 7617859662742011942 | ✅ 已对接 |

## 调用方式

通过本地代理 `/api/coze-proxy` 调用，避免CORS问题。

### 请求示例
```javascript
callCozeAgent(
  AGENT_CONFIGS.productResearch,
  { text: "产品名称：xxx", sessionId: "xxx" },
  {
    onStart: () => {},
    onAnswer: (answer) => {},
    onEnd: (data) => {},
    onError: (error) => {}
  }
)
```

## 响应格式

流式SSE响应，包含以下事件类型：
- `message_start` - 消息开始
- `answer` - 回答内容（逐字返回）
- `message_end` - 消息结束
- `error` - 错误信息

## Cloudsway视频生成

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/video-generate` | POST | 提交视频生成任务 |
| `/api/video-status` | GET | 查询视频状态 |
| `/api/video-download` | GET | 下载视频 |

### 限制
- 时长：4/8/12秒
- 尺寸：720x1280(9:16) / 1280x720(16:9) / 1024x1024(1:1)
- 生成时间：3-5分钟
