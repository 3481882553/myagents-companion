/**
 * Mock ISidecarApi — 用于所有依赖 Sidecar API 的服务测试
 */

import type { ISidecarApi } from '../../services/sidecar-api';

export class MockSidecarApi implements ISidecarApi {
  get = jest.fn();
  post = jest.fn();
  sendMessage = jest.fn();
  setToken = jest.fn();
  clearToken = jest.fn();

  /** 重置所有 mock */
  reset() {
    this.get.mockReset();
    this.post.mockReset();
    this.sendMessage.mockReset();
  }

  /** 预设成功响应 */
  mockGet<T>(path: string, response: T) {
    this.get.mockImplementation(async (p: string) => {
      if (p === path || p.startsWith(path)) return response;
      throw new Error(`Unexpected GET: ${p}`);
    });
  }

  mockPost<T>(path: string, response: T) {
    this.post.mockImplementation(async (p: string) => {
      if (p === path) return response;
      throw new Error(`Unexpected POST: ${p}`);
    });
  }
}
