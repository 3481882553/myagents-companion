/**
 * MarkdownRenderer 单元测试
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Linking: { openURL: jest.fn() },
  useColorScheme: () => 'light',
}));

jest.mock('../../theme/tokens', () => ({
  lightTokens: { ink: '#1c1612', inkMuted: '#6f6156', accentWarm: '#c26d3a', surface: '#fffcf7' },
  darkTokens: { ink: '#e8e0d8', inkMuted: '#968a7e', accentWarm: '#d4946a', surface: '#1c1612' },
}));

import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  // ========== 空内容 ==========

  it('空字符串返回 null', () => {
    const result = MarkdownRenderer({ content: '' });
    expect(result).toBeNull();
  });

  // ========== 基础渲染 ==========

  it('纯文本渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: 'Hello World' });
    expect(result).toBeTruthy();
    expect(result.type).toBe('View');
  });

  it('标题渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: '# 标题' });
    expect(result).toBeTruthy();
  });

  it('H2 标题渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: '## 二级标题' });
    expect(result).toBeTruthy();
  });

  it('列表渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: '- item1\n- item2' });
    expect(result).toBeTruthy();
  });

  it('引用渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: '> 引用文本' });
    expect(result).toBeTruthy();
  });

  it('多行内容渲染不崩溃', () => {
    const result = MarkdownRenderer({ content: '第一段\n\n第二段' });
    expect(result).toBeTruthy();
  });

  // ========== 边界情况 ==========

  it('超长文本不崩溃', () => {
    const longText = 'x'.repeat(10000);
    expect(() => MarkdownRenderer({ content: longText })).not.toThrow();
  });

  it('特殊字符不崩溃', () => {
    expect(() => MarkdownRenderer({ content: '<script>alert("xss")</script>' })).not.toThrow();
  });
});
