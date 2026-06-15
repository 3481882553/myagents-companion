/**
 * Auth 服务单元测试
 *
 * 覆盖：
 * - 配对流程（正确/错误配对码）
 * - Token 管理（存储/读取/删除）
 * - Token 过期检测
 */

import { AuthService } from '../auth';

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({ password: 'stored-token' }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

// Mock fetch
global.fetch = jest.fn();

function createAuthService() {
  const api = {
    post: jest.fn(),
    get: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  };
  return { auth: new AuthService(api as any), api };
}

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== 配对流程 ==========

  describe('配对流程', () => {
    it('正确配对码返回 JWT Token', async () => {
      const { auth, api } = createAuthService();
      api.post.mockResolvedValue({ token: 'jwt-token-123', expiresIn: 604800 });

      const result = await auth.pair('123456');
      expect(result.token).toBe('jwt-token-123');
      expect(api.post).toHaveBeenCalledWith('/api/pair', { code: '123456' });
    });

    it('错误配对码抛出错误', async () => {
      const { auth, api } = createAuthService();
      api.post.mockRejectedValue(new Error('Invalid pair code'));

      await expect(auth.pair('000000')).rejects.toThrow('Invalid pair code');
    });

    it('空配对码抛出错误', async () => {
      const { auth } = createAuthService();
      await expect(auth.pair('')).rejects.toThrow();
    });
  });

  // ========== Token 管理 ==========

  describe('Token 管理', () => {
    it('配对成功后存储 Token', async () => {
      const { auth, api } = createAuthService();
      api.post.mockResolvedValue({ token: 'jwt-token', expiresIn: 604800 });

      await auth.pair('123456');

      const Keychain = require('react-native-keychain');
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'myagents-token',
        'jwt-token'
      );
    });

    it('读取存储的 Token', async () => {
      const { auth } = createAuthService();
      const token = await auth.getStoredToken();
      expect(token).toBe('stored-token');
    });

    it('删除 Token', async () => {
      const { auth } = createAuthService();
      await auth.removeToken();
      const Keychain = require('react-native-keychain');
      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    });
  });

  // ========== Token 过期检测 ==========

  describe('Token 过期检测', () => {
    it('Token 未过期时返回 false', () => {
      const { auth } = createAuthService();
      const futureTime = Math.floor(Date.now() / 1000) + 86400; // 1 天后
      expect(auth.isTokenExpired(futureTime)).toBe(false);
    });

    it('Token 已过期时返回 true', () => {
      const { auth } = createAuthService();
      const pastTime = Math.floor(Date.now() / 1000) - 86400; // 1 天前
      expect(auth.isTokenExpired(pastTime)).toBe(true);
    });

    it('Token 即将过期（< 24h）时返回 true', () => {
      const { auth } = createAuthService();
      const soonTime = Math.floor(Date.now() / 1000) + 3600; // 1 小时后
      expect(auth.isTokenExpired(soonTime, 24 * 3600)).toBe(true);
    });
  });
});
