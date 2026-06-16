/**
 * messageStore 流式渲染 action 单元测试
 *
 * v0.3 W1：SSE 接入 ChatScreen，替代轮询
 *
 * 新增 action：
 * - startAssistantMessage: 创建占位 assistant 消息（status='streaming'）
 * - appendDelta: 追加文本到流式消息
 * - finalizeMessage: 完成流式消息（status='sent'）
 * - upsertToolBlock: 添加/更新工具调用块
 * - updateToolResult: 更新工具结果
 */

import { useMessageStore } from '../messageStore';
import type { Message, ToolCall } from '../../types/message';

const sessionId = 's1';
const messageId = 'msg-assistant-1';

/** 创建工具调用 fixture */
const makeTool = (overrides: Partial<ToolCall> = {}): ToolCall => ({
  id: 'tool-1',
  name: 'Bash',
  input: 'ls -la',
  status: 'running',
  startTime: Date.now(),
  ...overrides,
});

describe('messageStore — 流式 action', () => {
  beforeEach(() => {
    useMessageStore.getState().clearMessages(sessionId);
  });

  // ── startAssistantMessage ──

  describe('startAssistantMessage', () => {
    it('创建空内容的 assistant 占位消息', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);

      const msgs = useMessageStore.getState().messages[sessionId];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].id).toBe(messageId);
      expect(msgs[0].role).toBe('assistant');
      expect(msgs[0].content).toBe('');
      expect(msgs[0].status).toBe('streaming');
    });

    it('重复调用不创建第二条', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);

      const msgs = useMessageStore.getState().messages[sessionId];
      expect(msgs).toHaveLength(1);
    });

    it('新建另一个 session 的占位消息互不影响', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().startAssistantMessage('s2', 'msg-other');

      expect(useMessageStore.getState().messages[sessionId]).toHaveLength(1);
      expect(useMessageStore.getState().messages['s2']).toHaveLength(1);
    });
  });

  // ── appendDelta ──

  describe('appendDelta', () => {
    it('追加文本到占位消息', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().appendDelta(sessionId, messageId, 'Hello');

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.content).toBe('Hello');
      expect(msg.status).toBe('streaming');
    });

    it('多次追加拼接文本', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().appendDelta(sessionId, messageId, 'Hello');
      useMessageStore.getState().appendDelta(sessionId, messageId, ' ');
      useMessageStore.getState().appendDelta(sessionId, messageId, 'World');

      expect(useMessageStore.getState().messages[sessionId][0].content).toBe('Hello World');
    });

    it('消息不存在时不崩溃', () => {
      expect(() => {
        useMessageStore.getState().appendDelta(sessionId, 'nonexistent', 'text');
      }).not.toThrow();
    });

    it('追加后消息状态仍为 streaming', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().appendDelta(sessionId, messageId, 'Hi');

      expect(useMessageStore.getState().messages[sessionId][0].status).toBe('streaming');
    });
  });

  // ── finalizeMessage ──

  describe('finalizeMessage', () => {
    it('完成流式消息，状态变为 sent', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().appendDelta(sessionId, messageId, 'Final text');
      useMessageStore.getState().finalizeMessage(sessionId, messageId);

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.status).toBe('sent');
      expect(msg.content).toBe('Final text');
    });

    it('finalize 一个不存在的消息不崩溃', () => {
      expect(() => {
        useMessageStore.getState().finalizeMessage(sessionId, 'nonexistent');
      }).not.toThrow();
    });

    it('finalize 后再次 appendDelta 不再生效（消息已固化）', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().finalizeMessage(sessionId, messageId);
      useMessageStore.getState().appendDelta(sessionId, messageId, 'late chunk');

      // content 不应包含 late chunk
      expect(useMessageStore.getState().messages[sessionId][0].content).toBe('');
    });
  });

  // ── upsertToolBlock ──

  describe('upsertToolBlock', () => {
    it('添加工具调用到流式消息', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool());

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.toolCalls![0].name).toBe('Bash');
    });

    it('更新已存在的工具调用', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool());
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool({
        output: 'done', status: 'completed',
      }));

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.toolCalls).toHaveLength(1);
      expect(msg.toolCalls![0].output).toBe('done');
      expect(msg.toolCalls![0].status).toBe('completed');
    });

    it('多个工具调用的消息', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool({ id: 't1', name: 'Bash' }));
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool({ id: 't2', name: 'Read' }));

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.toolCalls).toHaveLength(2);
    });

    it('在非流式消息上添加工具调用', () => {
      // 先创建一个已完成的消息
      useMessageStore.getState().appendMessage(sessionId, {
        id: 'existing', sessionId, role: 'assistant',
        content: 'done', createdAt: Date.now(), status: 'sent',
      });
      useMessageStore.getState().upsertToolBlock(sessionId, 'existing', makeTool());

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.toolCalls).toHaveLength(1);
    });
  });

  // ── updateToolResult ──

  describe('updateToolResult', () => {
    it('更新工具结果', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().upsertToolBlock(sessionId, messageId, makeTool());
      useMessageStore.getState().updateToolResult(
        sessionId, messageId, 'tool-1', 'file1.txt\nfile2.txt', 'completed'
      );

      const tool = useMessageStore.getState().messages[sessionId][0].toolCalls![0];
      expect(tool.output).toBe('file1.txt\nfile2.txt');
      expect(tool.status).toBe('completed');
      expect(tool.endTime).toBeDefined();
    });

    it('更新不存在的工具 ID 不崩溃', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      expect(() => {
        useMessageStore.getState().updateToolResult(
          sessionId, messageId, 'nonexistent', 'output', 'completed'
        );
      }).not.toThrow();
    });
  });

  // ── 完整流式生命周期 ──

  describe('完整流式生命周期', () => {
    it('模拟一次完整的 SSE 流式对话', () => {
      const store = useMessageStore.getState();

      // 1. 用户发送消息
      store.appendMessage(sessionId, {
        id: 'user-1', sessionId, role: 'user',
        content: 'What is 2+2?', createdAt: Date.now(), status: 'sent',
      });

      // 2. 开始接收 assistant 回复
      store.startAssistantMessage(sessionId, messageId);

      // 3. 逐块接收文本
      store.appendDelta(sessionId, messageId, 'The');
      store.appendDelta(sessionId, messageId, ' answer');
      store.appendDelta(sessionId, messageId, ' is');
      store.appendDelta(sessionId, messageId, ' 4.');

      // 4. 中间有一个工具调用
      store.upsertToolBlock(sessionId, messageId, makeTool({ id: 't1', name: 'Bash' }));
      store.updateToolResult(sessionId, messageId, 't1', '4', 'completed');

      // 5. 继续流式输出
      store.appendDelta(sessionId, messageId, '\n\nThat was easy!');

      // 6. 完成
      store.finalizeMessage(sessionId, messageId);

      const msgs = useMessageStore.getState().messages[sessionId];
      expect(msgs).toHaveLength(2); // user + assistant

      const assistantMsg = msgs[1];
      expect(assistantMsg.content).toBe('The answer is 4.\n\nThat was easy!');
      expect(assistantMsg.status).toBe('sent');
      expect(assistantMsg.toolCalls).toHaveLength(1);
      expect(assistantMsg.toolCalls![0].output).toBe('4');
    });

    it('空内容完成（AI 无回复）', () => {
      useMessageStore.getState().startAssistantMessage(sessionId, messageId);
      useMessageStore.getState().finalizeMessage(sessionId, messageId);

      const msg = useMessageStore.getState().messages[sessionId][0];
      expect(msg.content).toBe('');
      expect(msg.status).toBe('sent');
    });
  });
});
