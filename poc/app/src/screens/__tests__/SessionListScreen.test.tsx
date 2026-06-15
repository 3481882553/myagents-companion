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
    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), addListener: jest.fn() };
    const result = SessionListScreen({
      navigation: mockNavigation as any,
      route: { key: 'test', name: 'SessionList' } as any,
    });
    expect(result).toBeTruthy();
  });
});
