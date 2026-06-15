/**
 * StorageService 单元测试
 * v0.2 架构升级 — 本地持久化
 *
 * 覆盖：
 * - 连接配置存储
 * - 会话缓存存储
 * - 过期缓存清理
 */

import { StorageService } from '../StorageService';

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    return {
      getString: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: string) => store.set(key, value)),
      delete: jest.fn((key: string) => store.delete(key)),
    };
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StorageService.clearConnection();
    StorageService.clearToken();
  });

  // ========== 连接配置存储 ==========

  describe('连接配置', () => {
    it('保存连接配置', () => {
      const config = {
        host: '192.168.1.5',
        port: 32101,
        token: 'test-token',
      };

      StorageService.saveConnection(config);

      // 验证保存后可读取
      const retrieved = StorageService.getConnection();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.host).toBe('192.168.1.5');
      expect(retrieved?.port).toBe(32101);
      expect(retrieved?.token).toBe('test-token');
    });

    it('获取连接配置', () => {
      const config = StorageService.getConnection();

      // 首次获取应返回 null
      expect(config).toBeNull();
    });
  });

  // ========== 会话缓存存储 ==========

  describe('会话缓存', () => {
    it('保存会话消息', async () => {
      const messages = [
        { id: 'msg_001', sessionId: 'ses_001', role: 'user' as const, content: '你好', createdAt: Date.now(), status: 'sent' as const },
      ];

      await StorageService.saveSessionCache('ses_001', messages);

      // 验证 AsyncStorage 被调用
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'session_ses_001',
        expect.any(String)
      );
    });

    it('获取会话消息', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify([
        { id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '你好', createdAt: Date.now(), status: 'sent' },
      ]));

      const messages = await StorageService.getSessionCache('ses_001');

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('你好');
    });

    it('获取不存在的会话返回空数组', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);

      const messages = await StorageService.getSessionCache('ses_999');

      expect(messages).toEqual([]);
    });
  });

  // ========== 过期缓存清理 ==========

  describe('过期缓存清理', () => {
    it('清理过期缓存', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const oldTime = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 天前

      AsyncStorage.getAllKeys.mockResolvedValue(['session_ses_001', 'session_ses_002']);
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify([{ id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '旧消息', createdAt: oldTime, status: 'sent' }]))
        .mockResolvedValueOnce(JSON.stringify([{ id: 'msg_002', sessionId: 'ses_002', role: 'user', content: '新消息', createdAt: Date.now(), status: 'sent' }]));

      await StorageService.clearExpiredCache(30);

      // 验证只清理了过期的缓存
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('session_ses_001');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('session_ses_002');
    });

    it('不清理未过期的缓存', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      AsyncStorage.getAllKeys.mockResolvedValue(['session_ses_001']);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify([{ id: 'msg_001', sessionId: 'ses_001', role: 'user', content: '新消息', createdAt: Date.now(), status: 'sent' }]));

      await StorageService.clearExpiredCache(30);

      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
