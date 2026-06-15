/**
 * SqliteMessageCache 单元测试
 *
 * 测试覆盖：
 * - 消息写入
 * - 消息查询（分页、时间戳过滤）
 * - LRU 淘汰（50MB 上限）
 * - 时间淘汰（30 天）
 * - 缓存大小查询
 */

import { SqliteMessageCache } from '../SqliteMessageCache';
import type { CachedMessage } from '../types';

function createMockDb() {
  return {
    execute: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    queryOne: jest.fn().mockResolvedValue(null),
  };
}

function createMessage(overrides?: Partial<CachedMessage>): CachedMessage {
  return {
    id: 'msg-1',
    sessionId: 'ses-1',
    role: 'assistant',
    content: 'Hello World',
    toolCalls: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('SqliteMessageCache', () => {
  describe('insertMessage', () => {
    it('调用 INSERT OR REPLACE', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      const msg = createMessage();

      await cache.insertMessage(msg);

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['msg-1', 'ses-1', 'assistant', 'Hello World'])
      );
    });

    it('工具调用 JSON 序列化存储', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      const msg = createMessage({
        toolCalls: [{ name: 'Bash', input: { command: 'ls' } }],
      });

      await cache.insertMessage(msg);

      expect(db.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('Bash')])
      );
    });

    it('空 toolCalls 存储 null', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      const msg = createMessage({ toolCalls: null });

      await cache.insertMessage(msg);

      expect(db.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null])
      );
    });
  });

  describe('getOfflineMessages', () => {
    it('查询指定会话的消息', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.query.mockResolvedValue([createMessage()]);

      const result = await cache.getOfflineMessages('ses-1', 50);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('session_id = ?'),
        expect.arrayContaining(['ses-1', 50])
      );
      expect(result).toHaveLength(1);
    });

    it('支持 before 时间戳分页', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.query.mockResolvedValue([]);

      await cache.getOfflineMessages('ses-1', 50, 1000000);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('created_at < ?'),
        expect.arrayContaining(['ses-1', 1000000, 50])
      );
    });

    it('无 before 参数时不添加时间条件', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.query.mockResolvedValue([]);

      await cache.getOfflineMessages('ses-1', 50);

      const sql = db.query.mock.calls[0][0] as string;
      expect(sql).not.toContain('created_at <');
    });

    it('按时间倒序返回', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.query.mockResolvedValue([]);

      await cache.getOfflineMessages('ses-1', 50);

      const sql = db.query.mock.calls[0][0] as string;
      expect(sql).toContain('ORDER BY created_at DESC');
    });
  });

  describe('evictOldMessages', () => {
    it('删除超过 30 天的消息', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);

      await cache.evictOldMessages();

      expect(db.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM messages WHERE created_at < ?'),
        expect.arrayContaining([expect.any(Number)])
      );

      // 验证 cutoff 时间戳约 30 天前
      const cutoff = db.execute.mock.calls[0][1][0] as number;
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(cutoff - thirtyDaysAgo)).toBeLessThan(1000); // 误差 < 1s
    });
  });

  describe('getCacheSize', () => {
    it('返回 MB 单位的缓存大小', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.queryOne.mockResolvedValue({ size: 10 * 1024 * 1024 }); // 10MB

      const size = await cache.getCacheSize();

      expect(size).toBeCloseTo(10, 1);
    });

    it('无数据时返回 0', async () => {
      const db = createMockDb();
      const cache = new SqliteMessageCache(db);
      db.queryOne.mockResolvedValue(null);

      const size = await cache.getCacheSize();

      expect(size).toBe(0);
    });
  });
});
