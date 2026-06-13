/**
 * connectionStore 单元测试
 *
 * 覆盖：
 * - 初始状态
 * - 设置连接
 * - 设置/清除 Token
 * - 断开连接
 */

import { createConnectionStore } from '../connectionStore';

describe('connectionStore', () => {
  let store: ReturnType<typeof createConnectionStore>;

  beforeEach(() => {
    store = createConnectionStore();
  });

  describe('初始状态', () => {
    it('默认状态', () => {
      expect(store.getState().status).toBe('disconnected');
      expect(store.getState().token).toBeNull();
      expect(store.getState().host).toBeNull();
    });
  });

  describe('连接管理', () => {
    it('设置连接', () => {
      store.getState().setConnection('192.168.1.5:32101');
      expect(store.getState().host).toBe('192.168.1.5:32101');
    });

    it('设置 Token', () => {
      store.getState().setToken('test-token');
      expect(store.getState().token).toBe('test-token');
    });

    it('清除 Token', () => {
      store.getState().setToken('test-token');
      store.getState().clearToken();
      expect(store.getState().token).toBeNull();
    });

    it('断开连接', () => {
      store.getState().setConnection('192.168.1.5:32101');
      store.getState().setToken('test-token');
      store.getState().disconnect();
      expect(store.getState().status).toBe('disconnected');
      expect(store.getState().token).toBeNull();
      expect(store.getState().host).toBeNull();
    });
  });
});
