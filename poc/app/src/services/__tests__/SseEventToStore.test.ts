/**
 * useChatStream hook 单元测试
 *
 * v0.3 W1：SSE→Store 桥接 hook
 *
 * 职责：
 * 1. 创建 SseClient 并注册事件处理器
 * 2. 事件 → messageStore action 映射
 * 3. 连接生命周期管理（connect / disconnect / 重连）
 */

import { useMessageStore } from '../../store/messageStore';
import { sseEventToStoreAction } from '../sse-event-handler';

describe('sseEventToStoreAction', () => {
  const sessionId = 's1';
  let currentMessageId: { current: string | null };

  beforeEach(() => {
    useMessageStore.getState().clearMessages(sessionId);
    currentMessageId = { current: null };
  });

  it('message-chunk → appendDelta', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');

    sseEventToStoreAction(
      { type: 'chat:message-chunk', data: { text: 'Hello' } },
      useMessageStore.getState(), sessionId, currentMessageId,
    );
    sseEventToStoreAction(
      { type: 'chat:message-chunk', data: ' World' },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    const msg = useMessageStore.getState().messages[sessionId][0];
    expect(msg.content).toBe('Hello World');
  });

  it('message-chunk 忽略当无 currentMessageId', () => {
    sseEventToStoreAction(
      { type: 'chat:message-chunk', data: 'orphan' },
      useMessageStore.getState(), sessionId, currentMessageId,
    );
    // 应该不崩溃、不创建消息
    expect(useMessageStore.getState().messages[sessionId]).toBeUndefined();
  });

  it('tool-use-start → upsertToolBlock', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');

    sseEventToStoreAction(
      { type: 'chat:tool-use-start', data: { id: 't1', name: 'Bash', input: { cmd: 'ls' } } },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    const msg = useMessageStore.getState().messages[sessionId][0];
    expect(msg.toolCalls).toHaveLength(1);
    expect(msg.toolCalls![0].name).toBe('Bash');
    expect(msg.toolCalls![0].status).toBe('running');
  });

  it('tool-result-delta → updateToolResult', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');
    useMessageStore.getState().upsertToolBlock(sessionId, 'msg-1', {
      id: 't1', name: 'Bash', input: '{}', status: 'running', startTime: Date.now(),
    });

    sseEventToStoreAction(
      { type: 'chat:tool-result-delta', data: { tool_use_id: 't1', text: 'partial' } },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    const msg = useMessageStore.getState().messages[sessionId][0];
    expect(msg.toolCalls![0].output).toBe('partial');
  });

  it('tool-result-complete → updateToolResult (completed)', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');
    useMessageStore.getState().upsertToolBlock(sessionId, 'msg-1', {
      id: 't1', name: 'Bash', input: '{}', status: 'running', startTime: Date.now(),
    });

    sseEventToStoreAction(
      { type: 'chat:tool-result-complete', data: { tool_use_id: 't1', content: 'final output' } },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    const msg = useMessageStore.getState().messages[sessionId][0];
    expect(msg.toolCalls![0].status).toBe('completed');
    expect(msg.toolCalls![0].output).toBe('final output');
  });

  it('message-complete → finalizeMessage + 清除 currentMessageId', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');
    useMessageStore.getState().appendDelta(sessionId, 'msg-1', 'done');

    sseEventToStoreAction(
      { type: 'chat:message-complete', data: {} },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    expect(currentMessageId.current).toBeNull();
    expect(useMessageStore.getState().messages[sessionId][0].status).toBe('sent');
  });

  it('message-error → finalizeMessage + 清除 currentMessageId', () => {
    currentMessageId.current = 'msg-1';
    useMessageStore.getState().startAssistantMessage(sessionId, 'msg-1');

    sseEventToStoreAction(
      { type: 'chat:message-error', data: {} },
      useMessageStore.getState(), sessionId, currentMessageId,
    );

    expect(currentMessageId.current).toBeNull();
  });
});
