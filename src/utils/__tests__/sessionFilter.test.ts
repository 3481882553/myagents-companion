/**
 * sessionFilter 单元测试
 * v0.2 架构升级 — 会话过滤优化
 *
 * 覆盖：
 * - 过滤内部会话
 * - 过滤 Cron 会话
 * - 过滤小助理会话
 * - 保留正常会话
 * - 调试模式
 */

import { filterUserSessions, getFilteredSessions } from '../sessionFilter';
import type { Session } from '../../types/session';

function createSession(overrides?: Partial<Session>): Session {
  return {
    id: 'ses_001',
    title: '测试会话',
    lastMessageAt: Date.now(),
    messageCount: 5,
    isInternal: false,
    ...overrides,
  };
}

describe('sessionFilter', () => {
  // ========== 过滤内部会话 ==========

  describe('过滤内部会话', () => {
    it('过滤 internal=true 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', isInternal: false }),
        createSession({ id: 'ses_002', isInternal: true }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ses_001');
    });

    it('保留 internal=false 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', isInternal: false }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
    });
  });

  // ========== 过滤 Cron 会话 ==========

  describe('过滤 Cron 会话', () => {
    it('过滤有 cronTaskId 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001' }),
        createSession({ id: 'ses_002', cronTaskId: 'cron_001' }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ses_001');
    });

    it('保留没有 cronTaskId 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', cronTaskId: undefined }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
    });
  });

  // ========== 过滤小助理会话 ==========

  describe('过滤小助理会话', () => {
    it('过滤 agentDir 为 ~/.myagents 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', agentDir: '/Users/test/project' }),
        createSession({ id: 'ses_002', agentDir: '/Users/test/.myagents' }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ses_001');
    });

    it('保留 agentDir 不是 ~/.myagents 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', agentDir: '/Users/test/project' }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
    });

    it('保留没有 agentDir 的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', agentDir: undefined }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
    });
  });

  // ========== 综合测试 ==========

  describe('综合测试', () => {
    it('过滤多种类型的会话', () => {
      const sessions = [
        createSession({ id: 'ses_001', title: '正常会话' }),
        createSession({ id: 'ses_002', title: '内部会话', isInternal: true }),
        createSession({ id: 'ses_003', title: 'Cron 会话', cronTaskId: 'cron_001' }),
        createSession({ id: 'ses_004', title: '小助理', agentDir: '/Users/test/.myagents' }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('正常会话');
    });

    it('空列表返回空数组', () => {
      const filtered = filterUserSessions([]);
      expect(filtered).toEqual([]);
    });

    it('所有会话都被过滤时返回空数组', () => {
      const sessions = [
        createSession({ id: 'ses_001', isInternal: true }),
        createSession({ id: 'ses_002', cronTaskId: 'cron_001' }),
      ];

      const filtered = filterUserSessions(sessions);

      expect(filtered).toEqual([]);
    });
  });

  // ========== 调试模式 ==========

  describe('getFilteredSessions', () => {
    it('返回被过滤的会话及原因', () => {
      const sessions = [
        createSession({ id: 'ses_001', title: '正常会话' }),
        createSession({ id: 'ses_002', title: '内部会话', isInternal: true }),
        createSession({ id: 'ses_003', title: 'Cron 会话', cronTaskId: 'cron_001' }),
      ];

      const filtered = getFilteredSessions(sessions);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].reason).toBe('内部会话');
      expect(filtered[1].reason).toBe('定时任务会话');
    });

    it('没有被过滤的会话时返回空数组', () => {
      const sessions = [
        createSession({ id: 'ses_001', title: '正常会话' }),
      ];

      const filtered = getFilteredSessions(sessions);

      expect(filtered).toEqual([]);
    });
  });
});
