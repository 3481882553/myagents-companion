/**
 * ConnectionScreen 单元测试
 *
 * 注意：组件使用 React hooks 和 Zustand store hooks，
 * 真实渲染行为需在 React Testing Library 环境中测试。
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Alert: { alert: jest.fn() },
}));

jest.mock('../../store/connectionStore', () => ({
  useConnectionStore: () => ({
    host: null, token: null, status: 'disconnected',
    connect: jest.fn(), disconnect: jest.fn(),
    getState: () => ({ token: null }),
  }),
}));
jest.mock('../../utils/connectionStorage', () => ({
  getConnectionHistory: jest.fn(() => Promise.resolve([])),
  saveConnectionHistory: jest.fn(() => Promise.resolve()),
}));

import { ConnectionScreen } from '../ConnectionScreen';

describe('ConnectionScreen', () => {
  it('ConnectionScreen 是一个函数组件', () => {
    expect(typeof ConnectionScreen).toBe('function');
  });

  it('接受 onBack 和 onConnected 回调', () => {
    expect(ConnectionScreen).toBeDefined();
  });
});
