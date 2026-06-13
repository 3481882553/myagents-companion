/**
 * LogQueryService 单元测试
 *
 * 测试覆盖：
 * - 关键词搜索
 * - limit/since 参数
 * - 空结果处理
 * - 参数编码
 */

import { LogQueryService } from '../LogQueryService';
import { MockSidecarApi } from '../../../__tests__/mocks';

function createService() {
  const api = new MockSidecarApi();
  const service = new LogQueryService(api);
  return { service, api };
}

describe('LogQueryService', () => {
  describe('searchLogs', () => {
    it('传递 keyword 参数', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.searchLogs('auth error');

      const calledUrl = api.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('keyword=auth+error');
    });

    it('无选项时只传 keyword', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.searchLogs('test');

      const calledUrl = api.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('keyword=test');
      expect(calledUrl).not.toContain('limit=');
      expect(calledUrl).not.toContain('since=');
    });

    it('传递 limit 参数', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.searchLogs('error', { limit: 10 });

      const calledUrl = api.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=10');
    });

    it('传递 since 参数', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.searchLogs('error', { since: '2026-01-01T00:00:00Z' });

      const calledUrl = api.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('since=2026-01-01');
    });

    it('同时传递 limit 和 since', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.searchLogs('error', { limit: 50, since: '2026-06-01' });

      const calledUrl = api.get.mock.calls[0][0] as string;
      expect(calledUrl).toContain('keyword=error');
      expect(calledUrl).toContain('limit=50');
      expect(calledUrl).toContain('since=2026-06-01');
    });

    it('返回日志条目列表', async () => {
      const { service, api } = createService();
      const mockLogs = [
        { timestamp: '2026-06-13 10:00:00', level: 'ERROR', source: 'NODE', content: 'auth error' },
        { timestamp: '2026-06-13 10:00:01', level: 'INFO', source: 'RUST', content: 'sidecar started' },
      ];
      api.get.mockResolvedValue(mockLogs);

      const result = await service.searchLogs('error');

      expect(result).toHaveLength(2);
      expect(result[0].level).toBe('ERROR');
      expect(result[1].level).toBe('INFO');
    });

    it('无匹配结果返回空数组', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      const result = await service.searchLogs('nonexistent');

      expect(result).toEqual([]);
    });

    it('API 错误向上传播', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Sidecar offline'));

      await expect(service.searchLogs('test')).rejects.toThrow('Sidecar offline');
    });
  });
});
