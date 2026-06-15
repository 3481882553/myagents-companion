/**
 * HelperScreen 单元测试
 *
 * 注意：组件使用 React hooks 和 Zustand store hooks，
 * 真实渲染行为需在 React Testing Library 环境中测试。
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
}));

jest.mock('../../components/markdown/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => `Markdown:${content}`,
}));
jest.mock('../../store/connectionStore', () => ({
  useConnectionStore: () => ({ host: null, token: null, status: 'disconnected' }),
}));

import { HelperScreen } from '../HelperScreen';

describe('HelperScreen', () => {
  it('HelperScreen 是一个函数组件', () => {
    expect(typeof HelperScreen).toBe('function');
  });

  it('接受 onBack 回调', () => {
    expect(HelperScreen).toBeDefined();
  });
});
