/**
 * messageStore — Zustand 消息状态管理
 * v0.2 架构升级
 */

import { create } from 'zustand';
import type { Message } from '../types/message';

interface MessageState {
  messages: Record<string, Message[]>;
  streaming: Record<string, string>;
  loading: boolean;
}

interface MessageActions {
  loadMessages: (sessionId: string, messages: Message[]) => void;
  loadMessagesFromApi: (sessionId: string, host: string, token: string) => Promise<Message[]>;
  sendMessage: (sessionId: string, text: string, host: string, token: string) => Promise<boolean>;
  appendMessage: (sessionId: string, message: Message) => void;
  startStreaming: (messageId: string) => void;
  appendChunk: (messageId: string, text: string) => void;
  completeStreaming: (messageId: string, sessionId: string) => void;
  clearMessages: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
}

export type MessageStore = MessageState & MessageActions;

// 单例 store
export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: {},
  streaming: {},
  loading: false,

  // 本地加载：直接设置消息数组
  loadMessages: (sessionId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    }));
  },

  // API 加载：从 Sidecar 获取消息
  loadMessagesFromApi: async (sessionId, host, token) => {
    set({ loading: true });
    try {
      const { ApiService } = await import('../services/ApiService');
      const api = new ApiService({ host, port: 32107, token });
      const msgs = await api.getMessages(sessionId);
      set((state) => ({
        messages: { ...state.messages, [sessionId]: msgs },
      }));
      set({ loading: false });
      return msgs;
    } catch {
      set({ loading: false });
      return [];
    }
  },

  appendMessage: (sessionId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: [...(state.messages[sessionId] || []), message],
    },
  })),

  startStreaming: (messageId) => set((state) => ({
    streaming: { ...state.streaming, [messageId]: '' },
  })),

  appendChunk: (messageId, text) => set((state) => ({
    streaming: {
      ...state.streaming,
      [messageId]: (state.streaming[messageId] || '') + text,
    },
  })),

  completeStreaming: (messageId, sessionId) => {
    const state = get();
    const content = state.streaming[messageId] || '';

    const newStreaming = { ...state.streaming };
    delete newStreaming[messageId];

    const newMessage: Message = {
      id: messageId,
      sessionId,
      role: 'assistant',
      content,
      createdAt: Date.now(),
      status: 'sent',
    };

    set({
      streaming: newStreaming,
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), newMessage],
      },
    });
  },

  clearMessages: (sessionId) => set((state) => {
    const newMessages = { ...state.messages };
    delete newMessages[sessionId];
    return { messages: newMessages };
  }),

  setLoading: (loading) => set({ loading }),

  sendMessage: async (sessionId, text, host, token) => {
    try {
      const { ApiService } = await import('../services/ApiService');
      const api = new ApiService({ host, port: 32107, token });
      return await api.sendMessage(sessionId, text);
    } catch {
      return false;
    }
  },
}));
