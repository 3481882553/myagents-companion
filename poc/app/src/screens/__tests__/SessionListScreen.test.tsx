/**
 * SessionListScreen 单元测试
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
}));

jest.mock('../../store/connectionStore', () => ({
  useConnectionStore: () => ({ host: null, token: null }),
}));

jest.mock('../../store/sessionStore', () => ({
  useSessionStore: () => ({
    sessions: [],
    loading: false,
    error: null,
    loadSessions: jest.fn(),
    setSessions: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
  }),
}));

import { SessionListScreen } from '../SessionListScreen';

describe('SessionListScreen', () => {
  const mockOnSelect = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SessionListScreen 是一个函数组件', () => {
    expect(typeof SessionListScreen).toBe('function');
  });

  it('创建组件不崩溃', () => {
    const result = SessionListScreen({
      onSelect: mockOnSelect,
      onBack: mockOnBack,
    });
    expect(result).toBeTruthy();
  });

  it('带 host 参数创建不崩溃', () => {
    const result = SessionListScreen({
      host: '192.168.1.5:32102',
      onSelect: mockOnSelect,
      onBack: mockOnBack,
    });
    expect(result).toBeTruthy();
  });
});
