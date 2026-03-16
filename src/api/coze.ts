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
  const { endpoint, token, projectId } = config;
  const { text, sessionId } = request;

  // 检查配置是否完整
  if (!token) {
    console.error('Coze API 配置不完整，请检查 token');
    callbacks.onError?.(new Error('API 配置不完整'));
    return;
  }

  try {
    // 使用代理 API 避免 CORS 问题
    const proxyUrl = '/api/coze-proxy';
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        token,
        projectId,
        sessionId,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API HTTP Error:', response.status, errorText);
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
    const fullAnswer = { value: '' };

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
          console.warn('Failed to parse SSE data:', dataText.substring(0, 200));
        }
      }
    }
  } catch (error) {
    console.error('Coze API Error:', error);
    console.error('Request details:', { endpoint, sessionId, textLength: text.length });
    callbacks.onError?.(error);
  }
}

/**
 * 处理扣子事件
 */
function handleCozeEvent(
  event: CozeResponse,
  callbacks: CozeCallbacks,
  fullAnswer: { value: string }
): void {
  const { type, content } = event;
  
  console.log('handleCozeEvent received, type:', type, 'content keys:', Object.keys(content || {}));

  switch (type) {
    case 'message_start':
      // 消息开始，可以记录 msg_id
      console.log('Message started:', content);
      break;

    case 'answer':
      // 核心：接收回答内容
      const answer = content?.answer || '';
      console.log('handleCozeEvent answer event, answer length:', answer.length, 'content:', content);
      fullAnswer.value += answer;
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
      // 消息结束，传递完整的回答
      callbacks.onEnd?.({ answer: fullAnswer.value });
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
  // Step 2 - 智能体1：产品调研（product-info-agent）
  productResearch: {
    endpoint: 'https://99qq4r5gbs.coze.site/stream_run',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIkxNV3ZQVkdRTG9WTnpGZURaN3dFZTdrOVA4MGxRWmQwIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjYxNzI0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE3NzkzMjk3Mzk3ODQxOTU4Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3ODE5MTAyNTQ3MDE3Nzc0In0.cfv_Avmpr-9U88OvDRZq9znZqXeQCWTmoWEd61q3bLF-R_K0jMba1jB-dLo955uIzQjUZLhovDmhb_g-TDZR_AdKl90xUYVx0cHR2sP_eZFE0Wu0Xzyt1Y-V2w97bbiHvMmJ_fSU9m1SzLhUbHJ_hPNLW4NCLdOHoVqRIf1c5KkEq8teJCuaCpknZ5VBacKrnyDzRgP1URC5maDH1y57WQU_j747w45d37CLoAhC0fairya9FAWBMqYpjXgGLOoVSpKlkVVrqg3NKjaLJvHQAym7WVmSfCxwfpmtfqmvQK98xts1zTT4QBVMXbs_B_gXxReuDEgExdf1tbDQs7pgYw',
    projectId: '7617792689441964078',
  },
  
  // Step 2 - 智能体2：TA画像调研（product-ta-agent）
  taResearch: {
    endpoint: 'https://khj28pmb4y.coze.site/stream_run',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInNIR0dINE9WdGdLVnpvbnl6QXBnZlhDbUZiT0QyaUpMIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjYxNjU0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE3ODA1Mjc5MjI4MzMwMDExIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3ODE4ODAyMTE3NDEwODUyIn0.sr7cRTb6gqkqen1Z8u8SsGkcfPa94npNnDATRyYjy6Qpl0JTerQceUxRm3cMyoyRiqTchK2Sc-m5Gs6ANOGXDP30vxr4tyPcOtQnmKjRqULMEuLQ2_q781xn__gX-VlxjyzRPwXE8IftqHci-aXMTWpbW4_fkCKd8u-Oju7acM0d31q4hqZ7Kh5f3WJLOfSo2osa7CMzEKXEdSPJ8fS8ISWb5MSgQkRizHavVKRNJWjKDVRJfq4sQ58O-5Cqsvh3VpKV5ajYMa7SKX4aVyVVwnuvF1xY-WQf55ghDlG3RNK-B2Q2PGqHgSIryrsHoJu83WG22aNydx5MNYMSYLz8tg',
    projectId: '7617799487003607050',
  },
  
  // Step 3 - 智能体3：脚本提案（基于产品信息和TA画像生成脚本提案）
  scriptGeneration: {
    endpoint: 'https://v96jpytncn.coze.site/stream_run',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3ZjhiZGYzLWM0YTQtNDU3Zi04YmFjLTE2OWFmZTZiOTAyNCJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInFhSHYwREtwZTdTTzVQME9iWENiVVpFODI0bWFBSlhxIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzczNjQzMDMzLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjE2NzQ3NzYzMDAyMjQ1MTMwIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjE3NzM4ODIxNjQzMjcyMTkyIn0.sjwawOJSpOQILDFeQUGwQftdqdRO4VA7eEMnxXpkb8_odI_PNw59Km5a9-U4UZl5XkHHjn39NuepttO0NT5h8gmLg9bqANYDhfOQ-SzgQ3lnsxFO7PfOFLQFtJqF8PiNyIEiPjj-cNGl9k_T4NB9WVEbkbW1yoCcXOB5UmeeOMUmrzDB8vYyqWb7HRTCjvEERbafmf6iAjj26K8PNgLkZpR1hWwjwbZXgWNCX-ujLv4LDVg5Ea1-uYMhtFn3n2Dcn6qR0Oa-KgiezZ7WDQNQrnnlX6bM5nMLmf_aIGOkUwClG43N4hOCsdZoOLepv7-Mj6V1pIZfuyIGLysmB1M58A',
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
