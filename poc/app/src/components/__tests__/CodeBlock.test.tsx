/**
 * CodeBlock 单元测试
 *
 * 注意：组件使用了 useState，在 node 环境直接调用函数时 hooks 受限。
 * 此测试验证组件不崩溃、异常安全、props 定义正确。
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  default: { setString: jest.fn(), getString: () => Promise.resolve('') },
}));

jest.mock('../../theme/tokens', () => ({
  lightTokens: { ink: '#1c1612', inkMuted: '#6f6156', surface: '#fffcf7' },
  darkTokens: { ink: '#e8e0d8', inkMuted: '#968a7e', surface: '#1c1612' },
}));

import { CodeBlock } from '../markdown/CodeBlock';

describe('CodeBlock', () => {
  it('创建 JavaScript 代码块不崩溃', () => {
    expect(() => CodeBlock({ language: 'javascript', code: 'const x = 1;' })).not.toThrow();
  });

  it('创建 Python 代码块不崩溃', () => {
    expect(() => CodeBlock({ language: 'python', code: 'print("hello")' })).not.toThrow();
  });

  it('未知语言不崩溃', () => {
    expect(() => CodeBlock({ language: 'unknown', code: 'some code' })).not.toThrow();
  });

  it('可折叠模式不崩溃', () => {
    expect(() => CodeBlock({ language: 'javascript', code: 'test', collapsible: true })).not.toThrow();
  });

  it('显示行号不崩溃', () => {
    const longCode = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
    expect(() => CodeBlock({ language: 'javascript', code: longCode, showLineNumbers: true })).not.toThrow();
  });

  it('空代码不崩溃', () => {
    expect(() => CodeBlock({ code: '' })).not.toThrow();
  });

  it('创建组件返回有效元素', () => {
    const result = CodeBlock({ language: 'bash', code: 'echo hello' });
    expect(result).toBeTruthy();
  });
});
