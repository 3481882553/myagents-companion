/**
 * sseEventHandler — SSE 事件 → Store action 映射
 *
 * v0.3 W1：纯函数，将 SSE 事件转换为 messageStore action 调用。
 * 无 React 依赖，便于单元测试和复用。
 */

import type { SSEEvent } from './event-coalescer';
import type { useMessageStore } from '../store/messageStore';

type MessageStore = ReturnType<typeof useMessageStore.getState>;

/**
 * 根据 SSE 事件类型调用对应的 store action。
 *
 * @param event      — 已解析的 SSE 事件（已过优先级/合并管线）
 * @param store      — messageStore.getState() 的快照
 * @param sessionId  — 当前会话 ID
 * @param messageId  — 当前正在流式写入的 assistant 消息 ID（mutable ref）
 */
export function sseEventToStoreAction(
  event: SSEEvent,
  store: MessageStore,
  sessionId: string,
  messageId: { current: string | null },
): void {
  switch (event.type) {
    // ── 消息流式 ──
    case 'chat:message-chunk': {
      const text = extractText(event.data);
      if (messageId.current && text) {
        store.appendDelta(sessionId, messageId.current, text);
      }
      break;
    }

    case 'chat:message-complete': {
      if (messageId.current) {
        store.finalizeMessage(sessionId, messageId.current);
        messageId.current = null;
      }
      break;
    }

    case 'chat:message-error':
    case 'chat:message-stopped': {
      if (messageId.current) {
        store.finalizeMessage(sessionId, messageId.current);
        messageId.current = null;
      }
      break;
    }

    // ── 工具调用 ──
    case 'chat:tool-use-start': {
      const data = event.data;
      if (messageId.current && data) {
        store.upsertToolBlock(sessionId, messageId.current, {
          id: data.id || `tool-${Date.now()}`,
          name: data.name || 'Unknown',
          input: typeof data.input === 'string'
            ? data.input
            : JSON.stringify(data.input || {}),
          status: 'running',
          startTime: Date.now(),
        });
      }
      break;
    }

    case 'chat:tool-input-delta': {
      // 工具输入流式增量 — 可以追加到 toolCall.input
      // 当前简化：不实时更新 input，在 tool-use-start 时已有完整 input
      break;
    }

    case 'chat:tool-result-delta': {
      const data = event.data;
      if (messageId.current && data?.tool_use_id) {
        const text = extractText(data.content ?? data);
        store.updateToolResult(
          sessionId, messageId.current, data.tool_use_id, text, 'running',
        );
      }
      break;
    }

    case 'chat:tool-result-complete': {
      const data = event.data;
      if (messageId.current && data?.tool_use_id) {
        const output = typeof data.content === 'string'
          ? data.content
          : JSON.stringify(data.content || '');
        store.updateToolResult(
          sessionId, messageId.current, data.tool_use_id, output, 'completed',
        );
      }
      break;
    }

    case 'chat:tool-attachment-update': {
      // 附件更新 — 后续版本实现
      break;
    }

    // ── 思考过程 ──
    case 'chat:thinking-start':
    case 'chat:thinking-chunk': {
      const text = extractText(event.data);
      if (messageId.current && text) {
        // 将思考过程追加到消息的 thinking 字段
        // （当前 messageStore 没有专门 action，直接用 appendDelta 替代
        //   后续可改为 appendThinking）
        store.appendDelta(sessionId, messageId.current, '');
        // TODO: 改为 store.appendThinking(sessionId, messageId.current, text)
      }
      break;
    }

    // ── 系统事件 ──
    case 'chat:system-init': {
      // 系统初始化握手 — 后续版本实现状态同步
      break;
    }

    case 'chat:status': {
      // 会话状态变更（running / idle）
      break;
    }

    // ── 交互式请求 ──
    case 'permission:request': {
      // 工具权限审批弹窗 — 后续版本实现
      break;
    }

    case 'ask-user-question:request': {
      // 用户选择题 — 后续版本实现
      break;
    }

    // ── 队列 ──
    case 'queue:added':
    case 'queue:started':
    case 'queue:cancelled': {
      break;
    }

    // ── 消息回放 ──
    case 'chat:message-replay': {
      // 历史消息回放（连接时）— 后续版本实现
      break;
    }

    case 'chat:content-block-stop': {
      // 内容块结束标记
      break;
    }

    default:
      // 未知事件不处理，不抛异常
      break;
  }
}

/** 从 event.data 中提取文本 */
function extractText(data: any): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    return data.text || data.content || data.thinking || '';
  }
  return '';
}
