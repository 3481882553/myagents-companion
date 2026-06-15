/**
 * messageStore v2 单元测试
 * v0.2 架构升级 — Zustand 状态管理
 *
 * 覆盖：
 * - 初始状态
 * - 加载消息
 * - 流式消息管理
 * - 持久化
 */

import { createMessageStore } from '../messageStore.v2';
import type { Message } from '../../types/message';

describe('messageStore v2', () => {
  let store: ReturnType<typeof createMessageStore>;

  beforeEach(() => {
    store = createMessageStore();
  });

  // ========== 初始状态 ==========

  describe('初始状态', () => {
    it('默认状态', () => {
      const state = store.getState();
      expect(state.messages).toEqual({});
      expect(state.streaming).toEqual({});
      expect(state.loading).toBe(false);
    });
  });

  // ========== 加载消息 ==========

  describe('loadMessages', () => {
    it('加载消息到指定会话', () => {
      const messages: Message[] = [
        { id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '你好', createdAt: Date.now(), status: 'sent' },
        { id: 'msg_002', sessionId: 'ses_001', role: 'assistant', content: '你好！', createdAt: Date.now(), status: 'sent' },
      ];

      store.getState().loadMessages('ses_001', messages);

      expect(store.getState().messages['ses_001']).toHaveLength(2);
    });

    it('加载新消息覆盖旧消息', () => {
      const oldMessages: Message[] = [
        { id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '旧消息', createdAt: Date.now(), status: 'sent' },
      ];
      const newMessages: Message[] = [
        { id: 'msg_002', sessionId: 'ses_001', role: 'user', content: '新消息', createdAt: Date.now(), status: 'sent' },
      ];

      store.getState().loadMessages('ses_001', oldMessages);
      store.getState().loadMessages('ses_001', newMessages);

      expect(store.getState().messages['ses_001']).toHaveLength(1);
      expect(store.getState().messages['ses_001'][0].content).toBe('新消息');
    });

    it('不同会话独立存储', () => {
      const messages1: Message[] = [
        { id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '会话1', createdAt: Date.now(), status: 'sent' },
      ];
      const messages2: Message[] = [
        { id: 'msg_002', sessionId: 'ses_002', role: 'user', content: '会话2', createdAt: Date.now(), status: 'sent' },
      ];

      store.getState().loadMessages('ses_001', messages1);
      store.getState().loadMessages('ses_002', messages2);

      expect(store.getState().messages['ses_001']).toHaveLength(1);
      expect(store.getState().messages['ses_002']).toHaveLength(1);
    });
  });

  // ========== 流式消息管理 ==========

  describe('流式消息', () => {
    it('开始流式消息', () => {
      store.getState().startStreaming('msg_001');
      expect(store.getState().streaming['msg_001']).toBe('');
    });

    it('追加 chunk', () => {
      store.getState().startStreaming('msg_001');
      store.getState().appendChunk('msg_001', 'Hello');
      store.getState().appendChunk('msg_001', ' World');
      expect(store.getState().streaming['msg_001']).toBe('Hello World');
    });

    it('完成流式消息', () => {
      store.getState().startStreaming('msg_001');
      store.getState().appendChunk('msg_001', 'Hello');
      store.getState().completeStreaming('msg_001', 'ses_001');

      expect(store.getState().streaming['msg_001']).toBeUndefined();
      expect(store.getState().messages['ses_001']).toHaveLength(1);
      expect(store.getState().messages['ses_001'][0].content).toBe('Hello');
    });

    it('完成流式消息设置正确角色', () => {
      store.getState().startStreaming('msg_001');
      store.getState().appendChunk('msg_001', 'Hello');
      store.getState().completeStreaming('msg_001', 'ses_001');

      expect(store.getState().messages['ses_001'][0].role).toBe('assistant');
    });

    it('完成流式消息设置正确状态', () => {
      store.getState().startStreaming('msg_001');
      store.getState().appendChunk('msg_001', 'Hello');
      store.getState().completeStreaming('msg_001', 'ses_001');

      expect(store.getState().messages['ses_001'][0].status).toBe('sent');
    });
  });

  // ========== 追加消息 ==========

  describe('appendMessage', () => {
    it('追加消息到会话', () => {
      const message: Message = {
        id: 'msg_001',
        sessionId: 'ses_001',
        role: 'user',
        content: '你好',
        createdAt: Date.now(),
        status: 'sent',
      };

      store.getState().appendMessage('ses_001', message);

      expect(store.getState().messages['ses_001']).toHaveLength(1);
      expect(store.getState().messages['ses_001'][0]).toEqual(message);
    });

    it('追加多条消息', () => {
      const message1: Message = {
        id: 'msg_001',
        sessionId: 'ses_001',
        role: 'user',
        content: '你好',
        createdAt: Date.now(),
        status: 'sent',
      };
      const message2: Message = {
        id: 'msg_002',
        sessionId: 'ses_001',
        role: 'assistant',
        content: '你好！',
        createdAt: Date.now(),
        status: 'sent',
      };

      store.getState().appendMessage('ses_001', message1);
      store.getState().appendMessage('ses_001', message2);

      expect(store.getState().messages['ses_001']).toHaveLength(2);
    });
  });

  // ========== 清除消息 ==========

  describe('clearMessages', () => {
    it('清除指定会话的消息', () => {
      store.getState().loadMessages('ses_001', [
        { id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '你好', createdAt: Date.now(), status: 'sent' },
      ]);

      store.getState().clearMessages('ses_001');

      expect(store.getState().messages['ses_001']).toBeUndefined();
    });

    it('清除不存在的会话不报错', () => {
      expect(() => store.getState().clearMessages('ses_999')).not.toThrow();
    });
  });
});
