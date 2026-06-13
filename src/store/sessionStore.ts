/**
 * sessionStore — 会话状态管理
 *
 * 职责：管理会话列表、当前会话、会话消息
 */

import { create } from 'zustand';

export interface Session {
  id: string;
  title: string;
  lastMessageAt: number;
  messageCount?: number;
  internal?: boolean;
}

interface SessionState {
  sessions: Session[];
  currentSession: string | null;
  messages: Record<string, any[]>;
}

interface SessionActions {
  loadSessions: (sessions: Session[]) => void;
  selectSession: (sessionId: string) => void;
  appendMessage: (sessionId: string, message: any) => void;
}

type SessionStore = SessionState & SessionActions;

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  messages: {},
};

export function createSessionStore() {
  return create<SessionStore>((set, get) => ({
    ...initialState,

    loadSessions: (sessions) => set({ sessions }),

    selectSession: (sessionId) => set({ currentSession: sessionId }),

    appendMessage: (sessionId, message) => {
      const messages = get().messages;
      const sessionMessages = messages[sessionId] || [];
      set({
        messages: {
          ...messages,
          [sessionId]: [...sessionMessages, message],
        },
      });
    },
  }));
}
