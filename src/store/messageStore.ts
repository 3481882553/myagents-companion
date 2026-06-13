/**
 * messageStore — 消息状态管理
 *
 * 职责：管理流式消息拼接、历史消息加载
 */

import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  createdAt: number;
}

interface MessageState {
  messages: Record<string, Message[]>;
  streaming: Record<string, string>;
}

interface MessageActions {
  startStreaming: (messageId: string) => void;
  appendChunk: (messageId: string, text: string) => void;
  completeStreaming: (messageId: string, sessionId: string) => void;
  loadMessages: (sessionId: string, messages: Message[]) => void;
}

type MessageStore = MessageState & MessageActions;

const initialState: MessageState = {
  messages: {},
  streaming: {},
};

export function createMessageStore() {
  return create<MessageStore>((set, get) => ({
    ...initialState,

    startStreaming: (messageId) => {
      set({
        streaming: {
          ...get().streaming,
          [messageId]: '',
        },
      });
    },

    appendChunk: (messageId, text) => {
      const streaming = get().streaming;
      const current = streaming[messageId] || '';
      set({
        streaming: {
          ...streaming,
          [messageId]: current + text,
        },
      });
    },

    completeStreaming: (messageId, sessionId) => {
      const streaming = get().streaming;
      const content = streaming[messageId] || '';

      // 从 streaming 中移除
      const newStreaming = { ...streaming };
      delete newStreaming[messageId];

      // 添加到 messages
      const currentMessages = get().messages;
      const sessionMessages = currentMessages[sessionId] || [];
      const newMessage: Message = {
        id: messageId,
        role: 'assistant',
        content,
        createdAt: Date.now(),
      };

      set({
        streaming: newStreaming,
        messages: {
          ...currentMessages,
          [sessionId]: [...sessionMessages, newMessage],
        },
      });
    },

    loadMessages: (sessionId, messages) => {
      const currentMessages = get().messages;
      set({
        messages: {
          ...currentMessages,
          [sessionId]: messages,
        },
      });
    },
  }));
}
