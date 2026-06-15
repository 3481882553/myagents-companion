/**
 * sessionStore v2 单元测试
 * v0.2 架构升级 — Zustand 状态管理
 *
 * 覆盖：
 * - 初始状态
 * - 加载会话列表
 * - 选择会话
 * - 追加消息
 * - 更新会话
 * - 持久化
 * - 错误处理
 */

import { createSessionStore } from '../sessionStore.v2';

describe('sessionStore v2', () => {
  let store: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    store = createSessionStore();
    jest.clearAllMocks();
  });

  // ========== 初始状态 ==========

  describe('初始状态', () => {
    it('默认状态', () => {
      const state = store.getState();
      expect(state.sessions).toEqual([]);
      expect(state.currentSessionId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ========== 加载会话列表 ==========

  describe('loadSessions', () => {
    it('加载成功更新 sessions', async () => {
      const mockSessions = [
        { id: 'ses_001', title: '会话 1', lastMessageAt: Date.now(), messageCount: 5, isInternal: false },
        { id: 'ses_002', title: '会话 2', lastMessageAt: Date.now(), messageCount: 3, isInternal: false },
      ];

      await store.getState().loadSessions(mockSessions);

      expect(store.getState().sessions).toEqual(mockSessions);
      expect(store.getState().loading).toBe(false);
      expect(store.getState().error).toBeNull();
    });

    it('加载时设置 loading 状态', () => {
      store.getState().setLoading(true);
      expect(store.getState().loading).toBe(true);
    });

    it('加载失败设置 error', () => {
      store.getState().setError('加载失败');
      expect(store.getState().error).toBe('加载失败');
    });
  });

  // ========== 选择会话 ==========

  describe('selectSession', () => {
    it('选择会话更新 currentSessionId', () => {
      store.getState().selectSession('ses_001');
      expect(store.getState().currentSessionId).toBe('ses_001');
    });

    it('切换会话更新 currentSessionId', () => {
      store.getState().selectSession('ses_001');
      store.getState().selectSession('ses_002');
      expect(store.getState().currentSessionId).toBe('ses_002');
    });
  });

  // ========== 追加消息 ==========

  describe('appendMessage', () => {
    it('追加消息更新会话的 messageCount', () => {
      store.getState().loadSessions([
        { id: 'ses_001', title: '会话 1', lastMessageAt: Date.now(), messageCount: 5, isInternal: false },
      ]);

      store.getState().appendMessage('ses_001');

      expect(store.getState().sessions[0].messageCount).toBe(6);
    });

    it('追加消息更新 lastMessageAt', () => {
      const oldTime = Date.now() - 100000;
      store.getState().loadSessions([
        { id: 'ses_001', title: '会话 1', lastMessageAt: oldTime, messageCount: 5, isInternal: false },
      ]);

      store.getState().appendMessage('ses_001');

      expect(store.getState().sessions[0].lastMessageAt).toBeGreaterThan(oldTime);
    });

    it('追加消息到不存在的会话不报错', () => {
      store.getState().loadSessions([]);
      expect(() => store.getState().appendMessage('ses_999')).not.toThrow();
    });
  });

  // ========== 更新会话 ==========

  describe('updateSession', () => {
    it('更新会话标题', () => {
      store.getState().loadSessions([
        { id: 'ses_001', title: '旧标题', lastMessageAt: Date.now(), messageCount: 5, isInternal: false },
      ]);

      store.getState().updateSession('ses_001', { title: '新标题' });

      expect(store.getState().sessions[0].title).toBe('新标题');
    });

    it('更新不存在的会话不报错', () => {
      store.getState().loadSessions([]);
      expect(() => store.getState().updateSession('ses_999', { title: 'test' })).not.toThrow();
    });
  });

  // ========== 清除错误 ==========

  describe('clearError', () => {
    it('清除错误状态', () => {
      store.getState().setError('错误');
      store.getState().clearError();
      expect(store.getState().error).toBeNull();
    });
  });
});
