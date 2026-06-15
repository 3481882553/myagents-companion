/**
 * sessionStore v2 — Zustand 状态管理
 * v0.2 架构升级 — 全局状态
 */

import { create } from 'zustand';
import type { Session } from '../types/session';

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  loading: boolean;
  error: string | null;
}

interface SessionActions {
  loadSessions: (sessions: Session[]) => void;
  selectSession: (sessionId: string) => void;
  appendMessage: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type SessionStore = SessionState & SessionActions;

export function createSessionStore() {
  return create<SessionStore>((set) => ({
    sessions: [],
    currentSessionId: null,
    loading: false,
    error: null,

    loadSessions: (sessions) => set({ sessions, loading: false, error: null }),

    selectSession: (sessionId) => set({ currentSessionId: sessionId }),

    appendMessage: (sessionId) => set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messageCount: s.messageCount + 1, lastMessageAt: Date.now() }
          : s
      ),
    })),

    updateSession: (sessionId, updates) => set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    })),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error, loading: false }),

    clearError: () => set({ error: null }),
  }));
}
