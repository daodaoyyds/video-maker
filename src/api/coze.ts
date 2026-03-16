/**
 * 扣子智能体 API 封装
 * 用于与扣子平台的智能体进行交互
 */

export interface CozeConfig {
  endpoint: string;
  token: string;
  projectId: string;
}

export interface CozeRequest {
  text: string;
  sessionId: string;
}

export interface CozeResponse {
  type: string;
  content: any;
}

export interface CozeCallbacks {
  onStart?: () => void;
  onAnswer?: (answer: string) => void;
  onToolRequest?: (toolRequest: any) => void;
  onToolResponse?: (toolResponse: any) => void;
  onEnd?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * 调用扣子智能体（流式）
 * @param config - 智能体配置
 * @param request - 请求参数
 * @param callbacks - 回调函数
 */
export async function callCozeAgent(
  config: CozeConfig,
  request: CozeRequest,
  callbacks: CozeCallbacks
): Promise<void> {
  const { endpoint, token } = config;
  const { text, sessionId } = request;

  // 检查配置是否完整
  if (!token) {
    console.error('Coze API 配置不完整，请检查 token');
    callbacks.onError?.(new Error('API 配置不完整'));
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // 触发开始回调
    callbacks.onStart?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullAnswer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const dataLines = block
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim());

        if (dataLines.length === 0) continue;

        const dataText = dataLines.join('\n');

        try {
          const parsed: CozeResponse = JSON.parse(dataText);
          handleCozeEvent(parsed, callbacks, fullAnswer);
        } catch (e) {
          console.warn('Failed to parse SSE data:', dataText);
        }
      }
    }
  } catch (error) {
    console.error('Coze API Error:', error);
    callbacks.onError?.(error);
  }
}

/**
 * 处理扣子事件
 */
function handleCozeEvent(
  event: CozeResponse,
  callbacks: CozeCallbacks,
  fullAnswer: string
): void {
  const { type, content } = event;

  switch (type) {
    case 'message_start':
      // 消息开始，可以记录 msg_id
      console.log('Message started:', content);
      break;

    case 'answer':
      // 核心：接收回答内容
      const answer = content?.answer || '';
      fullAnswer += answer;
      callbacks.onAnswer?.(answer);
      break;

    case 'tool_request':
      // 工具调用请求
      callbacks.onToolRequest?.(content?.tool_request);
      break;

    case 'tool_response':
      // 工具调用响应
      callbacks.onToolResponse?.(content?.tool_response);
      break;

    case 'message_end':
      // 消息结束
      callbacks.onEnd?.(content);
      break;

    case 'error':
      // 错误事件
      callbacks.onError?.(content);
      break;

    default:
      console.log('Unknown event type:', type, content);
  }
}

/**
 * 生成唯一的 Session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// 智能体配置
export const AGENT_CONFIGS = {
  // Step 2 - 智能体1：产品调研（根据商品图和名称，提供规格、功效等全面产品信息）
  productResearch: {
    endpoint: 'https://bcyhkv8qr9.coze.site/stream_run',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRkYTM5YTEyLTY3MjYtNDljZi05YzlmLTcyYWYzMjc4NDg1YyJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkpqa255cE9jc2xDU1Y2SjZMb1FHSU8yNGxLSTdOM01rIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNTg2MTI5LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE2NzQ3MzY3NDU0MjEyMTA1Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3NDk0NDIzMzE1Njc3MjI3In0.IEsHGc9YEdLZi-CftK7qMfBSEO1M7MwJOsbFYP1luq5MyCP8i6YIOHtOispFb-hYkCN_9kffsiiXfLUCrZS4mH9h9ALC6EEe0g08dFC-sfJlp0OlHDwJq_2LRJPnFPGGK3LRUX3y5mu46YLtO7F93Pu2rxmSdlQu0NLGwwIDYNP4NdUsf_M2TpWCQ3w4rat2HMfF7XU-MAYHqBSZpDfqTQfVmt0OmgaKNymuixtTgouYVwGBlm4_xrAwnpxVQbELeHLy0QlXcOQ7LNmizuiIAtFB4IPizneTvyKgTxS52eNFohQFQUzLiF7io719XtqvsF5DIH_ksnPB7P5sFGdSqg',
    projectId: '',
  },
  
  // Step 2 - 智能体2：TA画像调研（根据商品名进行舆情调研，推理TA画像）
  taResearch: {
    endpoint: 'https://ytkwtdyz82.coze.site/stream_run',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRkYTM5YTEyLTY3MjYtNDljZi05YzlmLTcyYWYzMjc4NDg1YyJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkpqa255cE9jc2xDU1Y2SjZMb1FHSU8yNGxLSTdOM01rIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNTg2MTY0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE2NzQ3MzY3NDU0MjEyMTA1Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3NDk0NTcxNTc1OTM0OTk1In0.VZ2Sci30fouZqZOJNpGpNO-QZ-1ORubBhnCHs6sP9-vlOiMdjB1H4MjYjWwBrS3e6288G3U_Zx6GvN_TmTS9miSrVB5vOCyGbjAOkBR6Cdx6v9TsMJ5xvLSMHwryGxJkXaBxxm_zCHQZf4E5Wub3pvp7bLgvKDq3VVPMfH8l4GD6Bldq-KmUWvcrTWGc2vygsVcIuOL3AbBfqclnqTKBVAUdqrcz3xFNMsoifpZNVJPT-fIJr4Ex2-ozChpq26lqtdMfX7xbnjGAm5_svI0FRfciQwSFANK28D6VOZcLvvzsW7NVRETkvkZznY_IMir6TnWK88Br0Bi_a4GtZuLOSA',
    projectId: '',
  },
  
  // 智能体3：脚本生成（待配置）
  scriptGeneration: {
    endpoint: '',
    token: '',
    projectId: '',
  },
  
  // 智能体4：脚本增强（待配置）
  scriptEnhancement: {
    endpoint: '',
    token: '',
    projectId: '',
  },
  
  // 智能体5：提示词组装（待配置）
  promptAssembly: {
    endpoint: '',
    token: '',
    projectId: '',
  },
  
  // 智能体6：视频生成（待配置）
  videoGeneration: {
    endpoint: '',
    token: '',
    projectId: '',
  },
};

/**
 * 检查智能体配置是否完整
 */
export function isAgentConfigValid(config: CozeConfig): boolean {
  return !!(config.endpoint && config.token && config.projectId);
}
