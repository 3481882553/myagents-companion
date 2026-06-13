/**
 * sessionStore 单元测试
 *
 * 覆盖：
 * - 初始状态
 * - 加载会话列表
 * - 选择会话
 * - 追加消息
 */

import { createSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  let store: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    store = createSessionStore();
  });

  describe('初始状态', () => {
    it('默认状态', () => {
      expect(store.getState()).toEqual({
        sessions: [],
        currentSession: null,
      });
    });
  });

  describe('会话管理', () => {
    it('加载会话列表', () => {
      const mockSessions = [
        { id: 'ses-001', title: '会话 1', lastMessageAt: Date.now() },
        { id: 'ses-002', title: '会话 2', lastMessageAt: Date.now() },
      ];
      store.getState().loadSessions(mockSessions);
      expect(store.getState().sessions).toHaveLength(2);
    });

    it('选择会话', () => {
      store.getState().loadSessions([
        { id: 'ses-001', title: '会话 1', lastMessageAt: Date.now() },
      ]);
      store.getState().selectSession('ses-001');
      expect(store.getState().currentSession).toBe('ses-001');
    });

    it('追加消息', () => {
      const msg = { id: 'msg-001', role: 'user', content: 'test', createdAt: Date.now() };
      store.getState().appendMessage('ses-001', msg);
      expect(store.getState().messages['ses-001']).toHaveLength(1);
    });
  });
});
