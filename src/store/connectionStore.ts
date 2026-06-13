/**
 * connectionStore — 连接状态管理
 *
 * 职责：管理 Sidecar 连接状态、Token、Host
 */

import { create } from 'zustand';

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  token: string | null;
  host: string | null;
}

interface ConnectionActions {
  setConnection: (host: string) => void;
  setToken: (token: string) => void;
  clearToken: () => void;
  setStatus: (status: ConnectionState['status']) => void;
  disconnect: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

const initialState: ConnectionState = {
  status: 'disconnected',
  token: null,
  host: null,
};

export function createConnectionStore() {
  return create<ConnectionStore>((set) => ({
    ...initialState,

    setConnection: (host) => set({ host }),

    setToken: (token) => set({ token }),

    clearToken: () => set({ token: null }),

    setStatus: (status) => set({ status }),

    disconnect: () => set({ ...initialState }),
  }));
}
