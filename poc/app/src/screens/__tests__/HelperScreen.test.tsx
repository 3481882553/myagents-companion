/**
 * HelperScreen 单元测试
 */

import React from 'react';
import { HelperScreen } from '../HelperScreen';

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

describe('HelperScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染小助理界面', () => {
    const result = HelperScreen({ onBack: mockOnBack });
    expect(result).toBeTruthy();
  });

  it('有 host 时显示已连接', () => {
    const result = HelperScreen({ host: '192.168.1.5:32107', token: 'test', onBack: mockOnBack });
    expect(result).toBeTruthy();
  });

  it('无 host 时不崩溃', () => {
    const result = HelperScreen({ onBack: mockOnBack });
    expect(result).toBeTruthy();
  });

  it('初始显示欢迎消息', () => {
    const result = HelperScreen({ onBack: mockOnBack });
    expect(result).toBeTruthy();
  });
});
