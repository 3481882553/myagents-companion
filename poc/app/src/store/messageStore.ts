/**
 * messageStore — Zustand 消息状态管理
 * v0.2 架构升级
 */

import { create } from 'zustand';
import type { Message, ToolCall } from '../types/message';

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

  // v0.3 SSE 流式 action（逐 token append，操作 messages 数组中的占位消息）
  startAssistantMessage: (sessionId: string, messageId: string) => void;
  appendDelta: (sessionId: string, messageId: string, text: string) => void;
  finalizeMessage: (sessionId: string, messageId: string) => void;
  upsertToolBlock: (sessionId: string, messageId: string, tool: ToolCall) => void;
  updateToolResult: (sessionId: string, messageId: string, toolId: string, output: string, status: ToolCall['status']) => void;

  // v0.2 旧版流式 action（保留兼容）
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

  // ── v0.2 本地加载 ──
  loadMessages: (sessionId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    }));
  },

  // ── v0.2 API 加载：从 Sidecar 获取消息 ──
  loadMessagesFromApi: async (sessionId, host, token) => {
    set({ loading: true });
    try {
      const { ApiService } = await import('../services/ApiService');
      const api = new ApiService({ host, port: 32103, token });
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

  // ── v0.3 SSE 流式 action ──

  /**
   * 创建一个空内容的 assistant 占位消息（status='streaming'）。
   * 如果 messageId 已存在，不重复创建。
   */
  startAssistantMessage: (sessionId, messageId) => {
    set((state) => {
      const sessionMsgs = state.messages[sessionId] || [];
      const existing = sessionMsgs.find(m => m.id === messageId);
      if (existing) return state; // 不重复创建

      const placeholder: Message = {
        id: messageId,
        sessionId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'streaming',
      };

      return {
        messages: {
          ...state.messages,
          [sessionId]: [...sessionMsgs, placeholder],
        },
      };
    });
  },

  /**
   * 追加文本到流式消息。
   * 只对 status='streaming' 的消息生效。
   */
  appendDelta: (sessionId, messageId, text) => {
    set((state) => {
      const sessionMsgs = state.messages[sessionId];
      if (!sessionMsgs) return state;

      const idx = sessionMsgs.findIndex(m => m.id === messageId);
      if (idx === -1) return state;

      const msg = sessionMsgs[idx];
      if (msg.status !== 'streaming') return state;

      const updated = [...sessionMsgs];
      updated[idx] = { ...msg, content: msg.content + text };

      return {
        messages: { ...state.messages, [sessionId]: updated },
      };
    });
  },

  /**
   * 完成流式消息：status='streaming' → 'sent'。
   * 找到则固化，找不到则忽略（不崩溃）。
   */
  finalizeMessage: (sessionId, messageId) => {
    set((state) => {
      const sessionMsgs = state.messages[sessionId];
      if (!sessionMsgs) return state;

      const idx = sessionMsgs.findIndex(m => m.id === messageId);
      if (idx === -1) return state;

      const msg = sessionMsgs[idx];
      if (msg.status !== 'streaming') return state;

      const updated = [...sessionMsgs];
      updated[idx] = { ...msg, status: 'sent' };

      return {
        messages: { ...state.messages, [sessionId]: updated },
      };
    });
  },

  /**
   * 添加或更新工具调用块。
   * 按 tool.id 去重：同一个 id 表示更新。
   */
  upsertToolBlock: (sessionId, messageId, tool) => {
    set((state) => {
      const sessionMsgs = state.messages[sessionId];
      if (!sessionMsgs) return state;

      const idx = sessionMsgs.findIndex(m => m.id === messageId);
      if (idx === -1) return state;

      const msg = sessionMsgs[idx];
      const existingTools = msg.toolCalls || [];
      const toolIdx = existingTools.findIndex(t => t.id === tool.id);

      let newTools: ToolCall[];
      if (toolIdx === -1) {
        newTools = [...existingTools, tool];
      } else {
        newTools = [...existingTools];
        newTools[toolIdx] = { ...newTools[toolIdx], ...tool };
      }

      const updated = [...sessionMsgs];
      updated[idx] = { ...msg, toolCalls: newTools };

      return {
        messages: { ...state.messages, [sessionId]: updated },
      };
    });
  },

  /**
   * 更新工具结果（output + status + endTime）。
   * 找不到工具 ID 则忽略（不崩溃）。
   */
  updateToolResult: (sessionId, messageId, toolId, output, status) => {
    set((state) => {
      const sessionMsgs = state.messages[sessionId];
      if (!sessionMsgs) return state;

      const idx = sessionMsgs.findIndex(m => m.id === messageId);
      if (idx === -1) return state;

      const msg = sessionMsgs[idx];
      const tools = msg.toolCalls || [];
      const toolIdx = tools.findIndex(t => t.id === toolId);
      if (toolIdx === -1) return state;

      const newTools = [...tools];
      newTools[toolIdx] = {
        ...newTools[toolIdx],
        output,
        status,
        endTime: Date.now(),
      };

      const updated = [...sessionMsgs];
      updated[idx] = { ...msg, toolCalls: newTools };

      return {
        messages: { ...state.messages, [sessionId]: updated },
      };
    });
  },

  // ── v0.2 旧版流式 action（保留兼容）──

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
      const api = new ApiService({ host, port: 32103, token });
      return await api.sendMessage(sessionId, text);
    } catch {
      return false;
    }
  },
}));
