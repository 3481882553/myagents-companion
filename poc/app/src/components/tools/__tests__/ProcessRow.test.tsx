/**
 * ProcessRow 单元测试
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}));

import { ProcessRow } from '../ProcessRow';

describe('ProcessRow', () => {
  it('创建 running 状态的行不崩溃', () => {
    expect(() =>
      ProcessRow({ icon: '💻', name: 'Bash', state: 'running' }),
    ).not.toThrow();
  });

  it('创建 completed 状态的行不崩溃', () => {
    expect(() =>
      ProcessRow({ icon: '📄', name: 'Read', state: 'completed', subtitle: 'file.ts' }),
    ).not.toThrow();
  });

  it('创建 error 状态的行不崩溃', () => {
    expect(() =>
      ProcessRow({ icon: '🔍', name: 'Grep', state: 'error' }),
    ).not.toThrow();
  });

  it('创建 interrupted 状态的行不崩溃', () => {
    expect(() =>
      ProcessRow({ icon: '🌐', name: 'WebFetch', state: 'interrupted' }),
    ).not.toThrow();
  });

  it('思考模式不崩溃', () => {
    expect(() =>
      ProcessRow({ icon: '🧠', name: 'Thinking', state: 'running', isThinking: true }),
    ).not.toThrow();
  });

  it('带子内容不崩溃', () => {
    expect(() =>
      ProcessRow({
        icon: '💻', name: 'Bash', state: 'completed',
        children: React.createElement('Text', {}, 'output'),
      }),
    ).not.toThrow();
  });

  it('默认展开不崩溃', () => {
    expect(() =>
      ProcessRow({
        icon: '💻', name: 'Bash', state: 'completed',
        defaultExpanded: true,
        children: React.createElement('Text', {}, 'expanded content'),
      }),
    ).not.toThrow();
  });
});
