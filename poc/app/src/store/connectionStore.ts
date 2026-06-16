/**
 * connectionStore — Zustand 连接状态管理
 * v0.2 架构升级
 */

import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

interface ConnectionState {
  host: string | null;
  port: number;
  token: string | null;
  status: ConnectionStatus;
  error: string | null;
}

interface ConnectionActions {
  connect: (host: string, port: number, pairCode: string) => Promise<void>;
  disconnect: () => void;
  setToken: (token: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export type ConnectionStore = ConnectionState & ConnectionActions;

// 单例 store
export const useConnectionStore = create<ConnectionStore>((set) => ({
  host: null,
  port: 32102,
  token: null,
  status: 'disconnected',
  error: null,

  connect: async (host, port, pairCode) => {
    set({ status: 'connecting', error: null });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // 健康检查
      const healthRes = await fetch(`http://${host}:${port}/health/live`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!healthRes.ok) throw new Error('连接失败');

      // 配对获取 Token
      const pairRes = await fetch(`http://${host}:${port}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pairCode }),
      });
      const { token } = await pairRes.json();

      set({
        host,
        port,
        token: token || null,
        status: 'connected',
        error: null,
      });
    } catch (err: any) {
      set({
        status: 'error',
        error: err.message || '连接失败',
      });
      throw err;
    }
  },

  disconnect: () => {
    set({
      host: null,
      port: 32102,
      token: null,
      status: 'disconnected',
      error: null,
    });
  },

  setToken: (token) => set({ token }),

  // 从持久化恢复连接（不发起网络请求）
  restoreConnection: (host: string, port: number, token: string) => {
    set({ host, port, token, status: 'connected', error: null });
  },

  setError: (error) => set({ error, status: 'error' }),

  clearError: () => set({ error: null }),
}));
