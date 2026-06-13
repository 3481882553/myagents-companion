/**
 * messageStore 单元测试
 *
 * 覆盖：
 * - 初始状态
 * - 流式消息管理
 * - 消息加载
 */

import { createMessageStore } from '../messageStore';

describe('messageStore', () => {
  let store: ReturnType<typeof createMessageStore>;

  beforeEach(() => {
    store = createMessageStore();
  });

  describe('初始状态', () => {
    it('默认状态', () => {
      expect(store.getState()).toEqual({
        messages: {},
        streaming: {},
      });
    });
  });

  describe('流式消息', () => {
    it('开始流式消息', () => {
      store.getState().startStreaming('msg-001');
      expect(store.getState().streaming['msg-001']).toBe('');
    });

    it('追加 chunk', () => {
      store.getState().startStreaming('msg-001');
      store.getState().appendChunk('msg-001', 'Hello');
      expect(store.getState().streaming['msg-001']).toBe('Hello');
    });

    it('完成流式消息', () => {
      store.getState().startStreaming('msg-001');
      store.getState().appendChunk('msg-001', 'Hello');
      store.getState().completeStreaming('msg-001');
      expect(store.getState().streaming['msg-001']).toBeUndefined();
      expect(store.getState().messages['ses-001']).toBeDefined();
    });
  });

  describe('消息加载', () => {
    it('加载历史消息', () => {
      const messages = [
        { id: 'msg-001', role: 'user', content: 'test', createdAt: Date.now() },
      ];
      store.getState().loadMessages('ses-001', messages);
      expect(store.getState().messages['ses-001']).toHaveLength(1);
    });
  });
});
