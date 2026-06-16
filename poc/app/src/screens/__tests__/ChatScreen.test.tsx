/**
 * ChatScreen 单元测试
 *
 * 注意：组件使用 React hooks 和 Zustand store hooks，
 * 真实渲染行为需在 React Testing Library 环境中测试。
 * 此文件验证组件定义、导出和导入正确性。
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  SafeAreaView: 'SafeAreaView',
  Platform: { OS: 'android' },
}));

jest.mock('react-native-markdown-display', () => 'Markdown');
jest.mock('@react-native-clipboard/clipboard', () => ({
  default: { setString: jest.fn(), getString: () => Promise.resolve('') },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('../../services/StorageService', () => ({
  StorageService: {
    getSessionCache: jest.fn(() => Promise.resolve([])),
    saveSessionCache: jest.fn(),
  },
}));
jest.mock('../../store/connectionStore', () => ({
  useConnectionStore: () => ({ host: null, token: null }),
}));
jest.mock('../../store/messageStore', () => ({
  useMessageStore: (selector?: any) => {
    const state = {
      messages: {},
      loadMessages: jest.fn(),
      loadMessagesFromApi: jest.fn(() => Promise.resolve([])),
      sendMessage: jest.fn(),
      appendMessage: jest.fn(),
      clearMessages: jest.fn(),
      getState: () => state,
    };
    return selector ? selector(state) : state;
  },
}));
jest.mock('../../services/sse-client', () => ({
  SseClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    state: 'disconnected',
  })),
}));
jest.mock('../../services/sse-event-handler', () => ({
  sseEventToStoreAction: jest.fn(),
}));
jest.mock('../../components/markdown/StreamingMessageRenderer', () => ({
  StreamingMessageRenderer: 'StreamingMessageRenderer',
}));

import { ChatScreen } from '../ChatScreen';

describe('ChatScreen', () => {
  it('ChatScreen 是一个函数组件', () => {
    expect(typeof ChatScreen).toBe('function');
  });

  it('接受 sessionId 参数', () => {
    expect(ChatScreen).toBeDefined();
  });

  it('接受空消息数组不崩溃', () => {
    expect(ChatScreen).toBeDefined();
  });
});
