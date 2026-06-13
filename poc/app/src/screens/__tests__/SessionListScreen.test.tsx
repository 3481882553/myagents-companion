/**
 * SessionListScreen 单元测试
 *
 * 覆盖：
 * - 基础渲染
 * - 组件创建
 */

import React from 'react';
import { SessionListScreen } from '../SessionListScreen';

// Mock react-native
jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
}));

describe('SessionListScreen', () => {
  const mockOnSelect = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染会话列表页面', () => {
    const result = SessionListScreen({
      onSelect: mockOnSelect,
      onBack: mockOnBack,
    });
    expect(result).toBeTruthy();
  });

  it('带 host 参数渲染', () => {
    const result = SessionListScreen({
      host: '192.168.1.5:32102',
      onSelect: mockOnSelect,
      onBack: mockOnBack,
    });
    expect(result).toBeTruthy();
  });

  it('不带 host 参数渲染', () => {
    const result = SessionListScreen({
      onSelect: mockOnSelect,
      onBack: mockOnBack,
    });
    expect(result).toBeTruthy();
  });
});
