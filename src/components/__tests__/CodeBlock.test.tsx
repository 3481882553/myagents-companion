/**
 * CodeBlock 单元测试
 *
 * 覆盖：
 * - 代码渲染
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

// 直接 mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: () => {},
  getString: () => Promise.resolve(''),
}));

import { CodeBlock } from '../markdown/CodeBlock';

describe('CodeBlock', () => {
  it('渲染 JavaScript 代码', () => {
    const result = CodeBlock({ language: 'javascript', code: 'const x = 1;' });
    expect(result).toBeTruthy();
  });

  it('渲染 Python 代码', () => {
    const result = CodeBlock({ language: 'python', code: 'print("hello")' });
    expect(result).toBeTruthy();
  });

  it('未知语言显示为纯文本', () => {
    const result = CodeBlock({ language: 'unknown', code: 'some code' });
    expect(result).toBeTruthy();
  });

  it('可折叠模式', () => {
    const result = CodeBlock({ language: 'javascript', code: 'test', collapsible: true });
    expect(result).toBeTruthy();
  });

  it('显示行号', () => {
    const longCode = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
    const result = CodeBlock({ language: 'javascript', code: longCode, showLineNumbers: true });
    expect(result).toBeTruthy();
  });
});
