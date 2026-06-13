/**
 * MessageRenderer 单元测试
 *
 * 覆盖：
 * - 消息类型
 * - 组件创建
 */

import React from 'react';

// 直接 mock react-native
jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
}));

import { MessageRenderer } from '../markdown/MessageRenderer';

describe('MessageRenderer', () => {
  it('用户消息', () => {
    const result = MessageRenderer({ role: 'user', content: 'Hello' });
    expect(result).toBeTruthy();
  });

  it('AI 消息', () => {
    const result = MessageRenderer({ role: 'assistant', content: 'Hello' });
    expect(result).toBeTruthy();
  });

  it('系统消息', () => {
    const result = MessageRenderer({ role: 'system', content: 'System message' });
    expect(result).toBeTruthy();
  });

  it('空内容不崩溃', () => {
    expect(() => MessageRenderer({ role: 'assistant', content: '' })).not.toThrow();
  });

  it('长消息不崩溃', () => {
    const longContent = 'x'.repeat(5000);
    expect(() => MessageRenderer({ role: 'assistant', content: longContent })).not.toThrow();
  });
});
