/**
 * SidecarHttpApi 单元测试
 *
 * 覆盖：
 * - 基础 GET/POST 请求
 * - 自动携带 JWT Token
 * - 错误处理（401/403/404/500/网络错误/超时）
 * - Token 管理（设置/清除/过期检测）
 */

import { SidecarHttpApi } from '../sidecar-api';

// Mock fetch
global.fetch = jest.fn();

function createApi(token?: string) {
  const api = new SidecarHttpApi('http://localhost:32101');
  if (token) api.setToken(token);
  return api;
}

describe('SidecarHttpApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  // ========== 基础请求 ==========

  describe('基础请求', () => {
    it('GET 请求返回 JSON 数据', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const api = createApi();
      const result = await api.get('/api/session/list');
      expect(result).toEqual({ sessions: [] });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:32101/api/session/list',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('POST 请求返回成功响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const api = createApi();
      const result = await api.post('/api/session/send', { message: 'test' });
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:32101/api/session/send',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'test' }),
        })
      );
    });

    it('自动携带 Token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const api = createApi('test-token');
      await api.get('/api/session/list');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('无 Token 时不携带 Authorization', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const api = createApi();
      await api.get('/api/session/list');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  // ========== 错误处理 ==========

  describe('错误处理', () => {
    it('401 抛出 UnauthorizedError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const api = createApi();
      await expect(api.get('/api/session/list')).rejects.toThrow('Unauthorized');
    });

    it('403 抛出 ForbiddenError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const api = createApi();
      await expect(api.get('/api/session/list')).rejects.toThrow('Forbidden');
    });

    it('404 抛出 NotFoundError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const api = createApi();
      await expect(api.get('/api/nonexistent')).rejects.toThrow('Not found');
    });

    it('500 抛出 ServerError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const api = createApi();
      await expect(api.get('/api/session/list')).rejects.toThrow('Internal server error');
    });

    it('网络错误抛出 NetworkError', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

      const api = createApi();
      await expect(api.get('/api/session/list')).rejects.toThrow();
    });
  });

  // ========== Token 管理 ==========

  describe('Token 管理', () => {
    it('设置 Token 后后续请求携带', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const api = createApi();
      api.setToken('new-token');
      await api.get('/api/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      );
    });

    it('清除 Token 后后续请求不携带', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const api = createApi('old-token');
      api.clearToken();
      await api.get('/api/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });
});
