/**
 * ApiService 单元测试
 * v0.2 架构升级 — 统一数据层
 *
 * 覆盖：
 * - 会话列表获取 + 格式转换
 * - 会话消息获取 + 格式转换
 * - 消息发送
 * - Token 管理
 * - 错误处理（401/403/404/500/网络错误）
 */

import { ApiService } from '../ApiService';
import type { ConnectionConfig } from '../../types/connection';

// Mock fetch
global.fetch = jest.fn();

function createApi(config?: Partial<ConnectionConfig>) {
  const defaultConfig: ConnectionConfig = {
    host: '192.168.1.5',
    port: 32101,
    token: 'test-token',
    ...config,
  };
  return new ApiService(defaultConfig);
}

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ========== 会话列表 ==========

  describe('getSessionList', () => {
    it('返回格式化的会话列表', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          sessions: [
            { id: 'ses_001', title: '测试会话', lastActiveAt: '2026-06-14T10:00:00Z', stats: { messageCount: 5 } },
          ],
        }),
      });

      const sessions = await api.getSessionList();

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(expect.objectContaining({
        id: 'ses_001',
        title: '测试会话',
        messageCount: 5,
      }));
    });

    it('过滤内部会话', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          sessions: [
            { id: 'ses_001', title: '用户会话', internal: false },
            { id: 'ses_002', title: '内部会话', internal: true },
            { id: 'ses_003', title: 'Cron 会话', cronTaskId: 'cron_001' },
          ],
        }),
      });

      const sessions = await api.getSessionList();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('ses_001');
    });

    it('处理空会话列表', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const sessions = await api.getSessionList();

      expect(sessions).toEqual([]);
    });

    it('401 错误触发 Token 过期回调', async () => {
      const api = createApi();
      const onTokenExpired = jest.fn();
      api.setOnTokenExpired(onTokenExpired);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(api.getSessionList()).rejects.toThrow();
      expect(onTokenExpired).toHaveBeenCalled();
    });

    it('网络错误抛出异常', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(api.getSessionList()).rejects.toThrow('Network error');
    });
  });

  // ========== 会话消息 ==========

  describe('getMessages', () => {
    it('返回格式化的消息列表', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [
            { id: 'msg_001', role: 'user', content: '你好', createdAt: Date.now() },
            { id: 'msg_002', role: 'assistant', content: '你好！', createdAt: Date.now() },
          ],
        }),
      });

      const messages = await api.getMessages('ses_001');

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('解析工具调用', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [
            {
              id: 'msg_001',
              role: 'assistant',
              content: JSON.stringify([
                { type: 'text', text: '执行命令' },
                { type: 'tool_use', name: 'Bash', input: { command: 'ls' } },
              ]),
              createdAt: Date.now(),
            },
          ],
        }),
      });

      const messages = await api.getMessages('ses_001');

      expect(messages[0].toolCalls).toHaveLength(1);
      expect(messages[0].toolCalls![0].name).toBe('Bash');
    });

    it('解析思考过程', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [
            {
              id: 'msg_001',
              role: 'assistant',
              content: JSON.stringify([
                { type: 'thinking', thinking: '让我思考一下...' },
                { type: 'text', text: '答案是 42' },
              ]),
              createdAt: Date.now(),
            },
          ],
        }),
      });

      const messages = await api.getMessages('ses_001');

      expect(messages[0].thinking).toBe('让我思考一下...');
      expect(messages[0].content).toBe('答案是 42');
    });
  });

  // ========== 消息发送 ==========

  describe('sendMessage', () => {
    it('发送成功返回 true', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await api.sendMessage('ses_001', '测试消息');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/session/send'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ sessionId: 'ses_001', message: '测试消息' }),
        })
      );
    });

    it('发送失败返回 false', async () => {
      const api = createApi();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal error' }),
      });

      const result = await api.sendMessage('ses_001', '测试消息');

      expect(result).toBe(false);
    });
  });

  // ========== Token 管理 ==========

  describe('Token 管理', () => {
    it('设置 Token 后请求携带 Authorization', async () => {
      const api = createApi({ token: undefined });
      api.setToken('new-token');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      await api.getSessionList();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      );
    });

    it('清除 Token 后不携带 Authorization', async () => {
      const api = createApi();
      api.clearToken();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      await api.getSessionList();

      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });
});
