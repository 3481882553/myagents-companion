/**
 * messageStore v2 — Zustand 状态管理
 * v0.2 架构升级 — 消息状态
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
  appendMessage: (sessionId: string, message: Message) => void;
  startStreaming: (messageId: string) => void;
  appendChunk: (messageId: string, text: string) => void;
  completeStreaming: (messageId: string, sessionId: string) => void;
  clearMessages: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
}

export type MessageStore = MessageState & MessageActions;

export function createMessageStore() {
  return create<MessageStore>((set, get) => ({
    messages: {},
    streaming: {},
    loading: false,

    loadMessages: (sessionId, messages) => set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    })),

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

      // 从 streaming 中移除
      const newStreaming = { ...state.streaming };
      delete newStreaming[messageId];

      // 创建新消息
      const newMessage: Message = {
        id: messageId,
        sessionId,
        role: 'assistant',
        content,
        createdAt: Date.now(),
        status: 'sent',
      };

      // 添加到 messages
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
  }));
}
