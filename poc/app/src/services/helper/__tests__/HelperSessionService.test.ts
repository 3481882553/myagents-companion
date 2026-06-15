/**
 * HelperSessionService 单元测试
 *
 * 测试覆盖：
 * - 缓存命中（已有 sessionId）
 * - 新建会话
 * - CLAUDE.md 同步（桌面端优先 → App 内置 fallback）
 * - 发送初始消息
 * - 历史会话查询
 */

import { HelperSessionService } from '../HelperSessionService';
import { MockStorage, MockSidecarApi } from '../../../__tests__/mocks';

function createService() {
  const storage = new MockStorage();
  const api = new MockSidecarApi();
  const service = new HelperSessionService(storage, api);
  return { service, storage, api };
}

describe('HelperSessionService', () => {
  describe('ensureHelperSession', () => {
    it('已缓存 sessionId 时直接返回，不调用 API', async () => {
      const { service, storage, api } = createService();
      storage.seed({ 'helper.sessionId': 'existing-session-id' });

      const result = await service.ensureHelperSession();

      expect(result).toBe('existing-session-id');
      expect(api.post).not.toHaveBeenCalled();
      expect(api.get).not.toHaveBeenCalled();
    });

    it('无缓存时创建新会话并缓存 sessionId', async () => {
      const { service, storage, api } = createService();
      api.get.mockRejectedValue(new Error('Not Found')); // bundled-files 端点不存在
      api.post.mockResolvedValue({ sessionId: 'new-session-id' });

      const result = await service.ensureHelperSession();

      expect(result).toBe('new-session-id');
      expect(storage.set).toHaveBeenCalledWith('helper.sessionId', 'new-session-id');
    });

    it('调用正确的创建端点', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Not Found'));
      api.post.mockResolvedValue({ sessionId: 'id' });

      await service.ensureHelperSession();

      expect(api.post).toHaveBeenCalledWith(
        '/api/session/create-helper',
        expect.objectContaining({
          claudeMd: expect.any(String),
          supportSkill: expect.any(String),
          appVersion: expect.any(String),
        })
      );
    });

    it('Sidecar 支持 bundled-files 时同步最新版本', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue({
        version: '999',
        claudeMd: '# Latest CLAUDE.md from desktop',
        supportSkill: '# Latest support skill',
      });
      api.post.mockResolvedValue({ sessionId: 'id' });

      await service.ensureHelperSession();

      expect(api.post).toHaveBeenCalledWith(
        '/api/session/create-helper',
        expect.objectContaining({
          claudeMd: '# Latest CLAUDE.md from desktop',
          supportSkill: '# Latest support skill',
        })
      );
    });

    it('Sidecar bundled-files 端点不存在时使用 App 内置版本', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Not Found'));
      api.post.mockResolvedValue({ sessionId: 'id' });

      await service.ensureHelperSession();

      const callArgs = api.post.mock.calls[0][1];
      // 内置 CLAUDE.md 应包含系统提示词标识
      expect(callArgs.claudeMd).toContain('你是 MyAgents');
      expect(callArgs.supportSkill).toBeTruthy();
    });

    it('Sidecar 返回旧版本时使用 App 内置版本', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue({
        version: '0', // 旧版本
        claudeMd: '# Old version',
        supportSkill: '# Old skill',
      });
      api.post.mockResolvedValue({ sessionId: 'id' });

      await service.ensureHelperSession();

      const callArgs = api.post.mock.calls[0][1];
      // 应使用内置版本而非旧版本
      expect(callArgs.claudeMd).not.toBe('# Old version');
    });

    it('创建会话 API 返回 401 时抛出错误', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Not Found'));
      api.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.ensureHelperSession()).rejects.toThrow('Unauthorized');
    });

    it('创建会话 API 返回 500 时抛出错误', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Not Found'));
      api.post.mockRejectedValue(new Error('Internal Server Error'));

      await expect(service.ensureHelperSession()).rejects.toThrow('Internal Server Error');
    });

    it('网络断开时抛出错误', async () => {
      const { service, api } = createService();
      api.get.mockRejectedValue(new Error('Network request failed'));
      api.post.mockRejectedValue(new Error('Network request failed'));

      await expect(service.ensureHelperSession()).rejects.toThrow('Network request failed');
    });
  });

  describe('sendInitialMessage', () => {
    it('发送包含用户反馈和 /support 指令的消息', async () => {
      const { service, api } = createService();

      await service.sendInitialMessage('session-id', '连接失败', '1.0.0');

      expect(api.sendMessage).toHaveBeenCalledWith(
        'session-id',
        expect.stringContaining('连接失败')
      );
      expect(api.sendMessage).toHaveBeenCalledWith(
        'session-id',
        expect.stringContaining('/support')
      );
    });

    it('消息包含 App 版本信息', async () => {
      const { service, api } = createService();

      await service.sendInitialMessage('session-id', '问题描述', '2.0.0');

      expect(api.sendMessage).toHaveBeenCalledWith(
        'session-id',
        expect.stringContaining('2.0.0')
      );
    });

    it('使用正确的 sessionId', async () => {
      const { service, api } = createService();

      await service.sendInitialMessage('my-session', 'test', '1.0.0');

      expect(api.sendMessage).toHaveBeenCalledWith('my-session', expect.any(String));
    });
  });

  describe('getHelperHistory', () => {
    it('调用正确的 API 端点', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      await service.getHelperHistory();

      expect(api.get).toHaveBeenCalledWith('/api/session/list?internal=true');
    });

    it('返回会话列表', async () => {
      const { service, api } = createService();
      const mockSessions = [
        { id: 'ses-1', title: '小助理 #1', lastMessageAt: Date.now() },
        { id: 'ses-2', title: '小助理 #2', lastMessageAt: Date.now() - 86400000 },
      ];
      api.get.mockResolvedValue(mockSessions);

      const result = await service.getHelperHistory();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ses-1');
    });

    it('无历史时返回空数组', async () => {
      const { service, api } = createService();
      api.get.mockResolvedValue([]);

      const result = await service.getHelperHistory();

      expect(result).toEqual([]);
    });
  });
});
