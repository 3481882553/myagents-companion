/**
 * MarkdownRenderer 单元测试
 */

import React from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
}));

jest.mock('../../../theme/tokens', () => ({
  lightTokens: { ink: '#1c1612', inkMuted: '#968a7e', accentWarm: '#c26d3a' },
  darkTokens: { ink: '#f5f0e8', inkMuted: '#968a7e', accentWarm: '#e8a87c' },
}));

describe('MarkdownRenderer', () => {
  it('渲染普通文本', () => {
    const result = MarkdownRenderer({ content: 'Hello World' });
    expect(result).toBeTruthy();
  });

  it('渲染空内容', () => {
    const result = MarkdownRenderer({ content: '' });
    expect(result).toBeNull();
  });

  it('渲染标题', () => {
    const result = MarkdownRenderer({ content: '# Title\n## Subtitle\n### H3' });
    expect(result).toBeTruthy();
  });

  it('渲染列表', () => {
    const result = MarkdownRenderer({ content: '- Item 1\n- Item 2\n* Item 3' });
    expect(result).toBeTruthy();
  });

  it('渲染有序列表', () => {
    const result = MarkdownRenderer({ content: '1. First\n2. Second\n3. Third' });
    expect(result).toBeTruthy();
  });

  it('渲染引用', () => {
    const result = MarkdownRenderer({ content: '> This is a quote' });
    expect(result).toBeTruthy();
  });

  it('渲染代码块', () => {
    const result = MarkdownRenderer({ content: '```\nconst x = 1;\n```' });
    expect(result).toBeTruthy();
  });

  it('渲染粗体和斜体', () => {
    const result = MarkdownRenderer({ content: '**bold** and *italic*' });
    expect(result).toBeTruthy();
  });

  it('渲染行内代码', () => {
    const result = MarkdownRenderer({ content: 'Use `console.log()` for debugging' });
    expect(result).toBeTruthy();
  });

  it('渲染分割线', () => {
    const result = MarkdownRenderer({ content: '---' });
    expect(result).toBeTruthy();
  });

  it('渲染混合内容', () => {
    const content = '# Title\n\nText **bold** and `code`.\n\n- List item\n\n> Quote\n\n```\ncode block\n```';
    const result = MarkdownRenderer({ content });
    expect(result).toBeTruthy();
  });

  it('支持 dark 主题', () => {
    const result = MarkdownRenderer({ content: 'Hello', theme: 'dark' });
    expect(result).toBeTruthy();
  });
});
