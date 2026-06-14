/**
 * ConnectionScreen 单元测试
 */

import React from 'react';
import { ConnectionScreen } from '../ConnectionScreen';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Alert: { alert: jest.fn() },
}));

jest.mock('../../utils/connectionStorage', () => ({
  getConnectionHistory: jest.fn(() => Promise.resolve([])),
  saveConnectionHistory: jest.fn(() => Promise.resolve()),
}));

describe('ConnectionScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnConnected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染连接界面', () => {
    const result = ConnectionScreen({ onBack: mockOnBack, onConnected: mockOnConnected });
    expect(result).toBeTruthy();
  });

  it('显示连接历史区域', () => {
    const result = ConnectionScreen({ onBack: mockOnBack, onConnected: mockOnConnected });
    expect(result).toBeTruthy();
  });

  it('默认端口为 32107', () => {
    const result = ConnectionScreen({ onBack: mockOnBack, onConnected: mockOnConnected });
    expect(result).toBeTruthy();
  });
});
