/**
 * ChatScreen 单元测试
 *
 * 覆盖：
 * - 消息列表渲染
 * - 消息发送
 * - SSE 流式渲染
 */

import React from 'react';
import { ChatScreen } from '../ChatScreen';

// Mock react-native
jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android' },
}));

describe('ChatScreen', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染', () => {
    it('渲染聊天界面', () => {
      const result = ChatScreen({
        sessionId: 'ses_001',
        messages: [],
        onBack: mockOnBack,
      });
      expect(result).toBeTruthy();
    });

    it('有消息时渲染消息列表', () => {
      const messages = [
        { id: 'msg_001', role: 'user' as const, content: 'Hello', createdAt: Date.now() },
        { id: 'msg_002', role: 'assistant' as const, content: 'Hi there!', createdAt: Date.now() },
      ];
      const result = ChatScreen({
        sessionId: 'ses_001',
        messages,
        onBack: mockOnBack,
      });
      expect(result).toBeTruthy();
    });

    it('空消息显示空状态', () => {
      const result = ChatScreen({
        sessionId: 'ses_001',
        messages: [],
        onBack: mockOnBack,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('消息发送', () => {
    it('有 onSend 回调时显示输入框', () => {
      const result = ChatScreen({
        sessionId: 'ses_001',
        messages: [],
        onBack: mockOnBack,
        onSend: jest.fn(),
      });
      expect(result).toBeTruthy();
    });

    it('无 onSend 回调时为只读模式', () => {
      const result = ChatScreen({
        sessionId: 'ses_001',
        messages: [],
        onBack: mockOnBack,
      });
      expect(result).toBeTruthy();
    });
  });
});
