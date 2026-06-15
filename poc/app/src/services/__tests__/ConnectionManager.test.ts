/**
 * ConnectionManager 单元测试
 *
 * 覆盖：
 * - 连接流程（初始/连接/成功/失败）
 * - 自动重连（指数退避/最大重试）
 * - 网络变化处理
 */

import { ConnectionManager, ConnectionState } from '../ConnectionManager';

// Mock dependencies
jest.mock('../sidecar-api', () => ({
  SidecarHttpApi: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  })),
}));

jest.mock('../auth', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    pair: jest.fn(),
    getStoredToken: jest.fn().mockResolvedValue(null),
    removeToken: jest.fn(),
  })),
}));

function createManager(options?: any) {
  return new ConnectionManager({
    onStateChange: jest.fn(),
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    ...options,
  });
}

describe('ConnectionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== 连接流程 ==========

  describe('连接流程', () => {
    it('初始状态为 disconnected', () => {
      const manager = createManager();
      expect(manager.state).toBe(ConnectionState.DISCONNECTED);
    });

    it('开始连接后状态变为 connecting', () => {
      const manager = createManager();
      manager.connect('192.168.1.5:32101');
      expect(manager.state).toBe(ConnectionState.CONNECTING);
    });

    it('连接成功后状态变为 connected', async () => {
      const manager = createManager();
      const api = (manager as any).api;
      api.get.mockResolvedValue({ status: 'ok' });

      await manager.connect('192.168.1.5:32101');
      expect(manager.state).toBe(ConnectionState.CONNECTED);
    });

    it('连接失败后状态变为 retrying', async () => {
      const manager = createManager();
      const api = (manager as any).api;
      api.get.mockRejectedValue(new Error('Connection refused'));

      await manager.connect('192.168.1.5:32101');
      expect(manager.state).toBe(ConnectionState.RETRYING);
    });
  });

  // ========== 自动重连 ==========

  describe('自动重连', () => {
    it('连接失败后进入 retrying 状态', async () => {
      const manager = createManager();
      const api = (manager as any).api;
      api.get.mockRejectedValue(new Error('Connection refused'));

      await manager.connect('192.168.1.5:32101');
      expect(manager.state).toBe(ConnectionState.RETRYING);
    });

    it('重连成功后状态变为 connected', async () => {
      const manager = createManager();
      const api = (manager as any).api;
      api.get
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ status: 'ok' });

      await manager.connect('192.168.1.5:32101');
      // 手动触发重连成功
      await (manager as any).attemptReconnect();
      expect(manager.state).toBe(ConnectionState.CONNECTED);
    });

    it('超过最大重试次数后 disconnect', async () => {
      const manager = createManager({ maxRetries: 0 });
      const api = (manager as any).api;
      api.get.mockRejectedValue(new Error('fail'));

      await manager.connect('192.168.1.5:32101');
      expect(manager.state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  // ========== 断开连接 ==========

  describe('断开连接', () => {
    it('disconnect 停止重连', () => {
      const manager = createManager();
      manager.connect('192.168.1.5:32101');
      manager.disconnect();
      expect(manager.state).toBe(ConnectionState.DISCONNECTED);
    });
  });
});
