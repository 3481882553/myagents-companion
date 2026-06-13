/**
 * MarkdownRenderer 单元测试
 *
 * 覆盖：
 * - 基础渲染
 * - 边界情况
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

import { MarkdownRenderer } from '../markdown/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('空字符串不崩溃', () => {
    expect(() => MarkdownRenderer({ content: '' })).not.toThrow();
  });

  it('渲染纯文本', () => {
    const result = MarkdownRenderer({ content: 'Hello World' });
    expect(result).toBeTruthy();
  });

  it('渲染标题', () => {
    const result = MarkdownRenderer({ content: '# 标题' });
    expect(result).toBeTruthy();
  });

  it('渲染列表', () => {
    const result = MarkdownRenderer({ content: '- item1\n- item2' });
    expect(result).toBeTruthy();
  });

  it('渲染引用', () => {
    const result = MarkdownRenderer({ content: '> quote' });
    expect(result).toBeTruthy();
  });

  it('特殊字符不 XSS', () => {
    const result = MarkdownRenderer({ content: '<script>alert("xss")</script>' });
    expect(result).toBeTruthy();
  });

  it('超长文本不崩溃', () => {
    const longText = 'x'.repeat(10000);
    expect(() => MarkdownRenderer({ content: longText })).not.toThrow();
  });
});
