/**
 * HelperAdminProxy 单元测试
 *
 * 测试覆盖：
 * - GET 请求转发
 * - POST 请求转发
 * - 错误传播
 */

import { HelperAdminProxy } from '../HelperAdminProxy';
import { MockSidecarApi } from '../../../__tests__/mocks';

function createProxy() {
  const api = new MockSidecarApi();
  const proxy = new HelperAdminProxy(api);
  return { proxy, api };
}

describe('HelperAdminProxy', () => {
  describe('call', () => {
    it('GET 请求调用 api.get', async () => {
      const { proxy, api } = createProxy();
      api.get.mockResolvedValue({ servers: [] });

      const result = await proxy.call('/api/mcp/list', 'GET');

      expect(api.get).toHaveBeenCalledWith('/api/mcp/list');
      expect(result).toEqual({ servers: [] });
    });

    it('POST 请求调用 api.post 并传递 body', async () => {
      const { proxy, api } = createProxy();
      api.post.mockResolvedValue({ success: true });

      const result = await proxy.call('/api/mcp/enable', 'POST', { id: 'test', enabled: true });

      expect(api.post).toHaveBeenCalledWith('/api/mcp/enable', { id: 'test', enabled: true });
      expect(result).toEqual({ success: true });
    });

    it('POST 请求无 body 时调用 api.post(undefined)', async () => {
      const { proxy, api } = createProxy();
      api.post.mockResolvedValue({ tasks: [] });

      await proxy.call('/api/admin/cron/list', 'POST');

      expect(api.post).toHaveBeenCalledWith('/api/admin/cron/list', undefined);
    });

    it('API 错误向上传播', async () => {
      const { proxy, api } = createProxy();
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(proxy.call('/api/health/live', 'GET')).rejects.toThrow('Network error');
    });

    it('Provider 验证端点正确转发', async () => {
      const { proxy, api } = createProxy();
      api.post.mockResolvedValue({ success: true });

      const result = await proxy.call('/api/provider/verify', 'POST', { providerId: 'deepseek' });

      expect(api.post).toHaveBeenCalledWith('/api/provider/verify', { providerId: 'deepseek' });
      expect(result.success).toBe(true);
    });
  });
});
