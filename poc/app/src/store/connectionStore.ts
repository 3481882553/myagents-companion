/**
 * connectionStore — Zustand 连接状态管理
 * v0.2 架构升级
 */

import { create } from 'zustand';
import { logInfo, logError } from '../utils/log';

const TAG = 'connectionStore';

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
    logInfo(TAG, `connect: ${host}:${port} code=${pairCode}`);
    set({ status: 'connecting', error: null });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // 健康检查
      const healthStart = Date.now();
      const healthRes = await fetch(`http://${host}:${port}/health/live`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const healthDuration = Date.now() - healthStart;

      if (!healthRes.ok) {
        logError(TAG, `health: ${healthRes.status} ${healthDuration}ms`);
        throw new Error(`连接失败 (HTTP ${healthRes.status})`);
      }
      logInfo(TAG, `health: OK ${healthDuration}ms`);

      // 配对获取 Token
      const pairStart = Date.now();
      const pairRes = await fetch(`http://${host}:${port}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pairCode }),
      });
      const pairDuration = Date.now() - pairStart;
      const { token, error: pairError } = await pairRes.json();

      if (pairError || !token) {
        logError(TAG, `pair: 失败 ${pairDuration}ms ${pairError || 'no token'}`);
        throw new Error(pairError || '配对失败');
      }

      logInfo(TAG, `pair: 成功 ${pairDuration}ms`);
      set({
        host,
        port,
        token: token || null,
        status: 'connected',
        error: null,
      });
    } catch (err: any) {
      const errMsg = err?.message || '连接失败';
      logError(TAG, `connect: 失败 ${errMsg}`);
      set({
        status: 'error',
        error: errMsg,
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
