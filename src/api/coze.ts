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
  if (!token || !projectId) {
    console.error('Coze API 配置不完整，请检查 token 和 projectId');
    callbacks.onError?.(new Error('API 配置不完整'));
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: projectId,
        user_id: 'user-' + sessionId,
        session_id: sessionId,
        messages: [
          {
            role: 'user',
            content: text,
            content_type: 'text',
          },
        ],
        stream: true,
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
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        
        const dataText = line.slice(5).trim();
        if (dataText === '[DONE]') {
          callbacks.onEnd?.({ answer: fullAnswer });
          return;
        }

        try {
          const parsed = JSON.parse(dataText);
          if (parsed.event === 'message' && parsed.message?.content) {
            const content = parsed.message.content;
            fullAnswer += content;
            callbacks.onAnswer?.(content);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', dataText);
        }
      }
    }

    // 流结束
    callbacks.onEnd?.({ answer: fullAnswer });
  } catch (error) {
    console.error('Coze API Error:', error);
    callbacks.onError?.(error);
  }
}

// 注意：handleCozeEvent 函数已不再使用，直接内联处理逻辑
// 保留此注释以便后续参考

/**
 * 生成唯一的 Session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// 智能体配置
// 注意：这些配置需要替换为你自己的扣子智能体配置
export const AGENT_CONFIGS = {
  // Step 2 - 智能体1：产品调研（根据商品图和名称，提供规格、功效等全面产品信息）
  productResearch: {
    // 扣子 API 端点（不是 coze.site 的 Web 地址）
    endpoint: 'https://api.coze.cn/v3/chat',
    // 扣子访问令牌（需要从扣子后台获取）
    token: '',
    // 扣子 Bot ID
    projectId: '',
  },
  
  // Step 2 - 智能体2：TA画像调研（根据商品名进行舆情调研，推理TA画像）
  taResearch: {
    endpoint: 'https://api.coze.cn/v3/chat',
    token: '',
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
