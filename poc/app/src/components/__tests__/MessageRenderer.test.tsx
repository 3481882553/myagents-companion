/**
 * MessageRenderer 单元测试
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
}));

jest.mock('../../theme/tokens', () => ({
  lightTokens: { ink: '#1c1612', inkMuted: '#6f6156', paperElevated: '#fffcf7', line: 'rgba(28,22,18,0.1)', surface: '#faf6ee' },
  darkTokens: { ink: '#e8e0d8', inkMuted: '#968a7e', paperElevated: '#2e2825', line: 'rgba(232,224,216,0.1)', surface: '#1c1612' },
}));

import { MessageRenderer } from '../markdown/MessageRenderer';

describe('MessageRenderer', () => {
  it('用户消息渲染内容', () => {
    const result = MessageRenderer({ role: 'user', content: '你好' });
    expect(result).toBeTruthy();
  });

  it('助手消息渲染内容', () => {
    const result = MessageRenderer({ role: 'assistant', content: '你好！有什么可以帮助你的？' });
    expect(result).toBeTruthy();
  });

  it('系统消息渲染内容', () => {
    const result = MessageRenderer({ role: 'system', content: '系统通知' });
    expect(result).toBeTruthy();
  });

  it('三种角色均能渲染不崩溃', () => {
    for (const role of ['user', 'assistant', 'system'] as const) {
      expect(() => MessageRenderer({ role, content: '测试' })).not.toThrow();
    }
  });

  it('空内容不崩溃', () => {
    expect(() => MessageRenderer({ role: 'assistant', content: '' })).not.toThrow();
  });

  it('长消息不崩溃', () => {
    const long = 'x'.repeat(10000);
    expect(() => MessageRenderer({ role: 'assistant', content: long })).not.toThrow();
  });
});
