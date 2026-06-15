/**
 * HelperCard 组件测试
 *
 * 覆盖：
 * - 标题渲染
 * - 快捷输入框
 * - 快捷操作按钮
 * - 点击进入小助理
 * - 历史按钮
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HelperCard } from '../../components/HelperCard';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Mock helperSession service
jest.mock('../../services/helper', () => ({
  helperSession: {
    ensureHelperSession: jest.fn().mockResolvedValue('session-123'),
    sendInitialMessage: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('HelperCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ========== 基础渲染 ==========

  describe('基础渲染', () => {
    it('显示标题"AI 小助理"', () => {
      const { getByText } = render(<HelperCard />);
      expect(getByText(/AI 小助理/)).toBeTruthy();
    });

    it('显示输入框', () => {
      const { getByPlaceholderText } = render(<HelperCard />);
      expect(getByPlaceholderText(/告诉小助理想做什么/)).toBeTruthy();
    });

    it('显示快捷操作按钮', () => {
      const { getByText } = render(<HelperCard />);
      expect(getByText(/连接问题/)).toBeTruthy();
      expect(getByText(/配置模型/)).toBeTruthy();
      expect(getByText(/查看状态/)).toBeTruthy();
    });

    it('显示历史按钮', () => {
      const { getByTestId } = render(<HelperCard />);
      expect(getByTestId('helper-history-btn')).toBeTruthy();
    });
  });

  // ========== 输入交互 ==========

  describe('输入交互', () => {
    it('输入文本后回车发送', async () => {
      const { getByPlaceholderText } = render(<HelperCard />);
      const input = getByPlaceholderText(/告诉小助理想做什么/);

      fireEvent.changeText(input, '连接失败了');
      fireEvent(input, 'submitEditing');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
          sessionId: 'session-123',
          initialMessage: '连接失败了',
        }));
      });
    });

    it('空输入不发送', async () => {
      const { getByPlaceholderText } = render(<HelperCard />);
      const input = getByPlaceholderText(/告诉小助理想做什么/);

      fireEvent.changeText(input, '');
      fireEvent(input, 'submitEditing');

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('发送后清空输入框', async () => {
      const { getByPlaceholderText } = render(<HelperCard />);
      const input = getByPlaceholderText(/告诉小助理想做什么/);

      fireEvent.changeText(input, '测试消息');
      fireEvent(input, 'submitEditing');

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });
  });

  // ========== 快捷操作 ==========

  describe('快捷操作', () => {
    it('点击"连接问题"自动填入并发送', async () => {
      const { getByText } = render(<HelperCard />);
      fireEvent.press(getByText(/连接问题/));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
          initialMessage: expect.stringContaining('连接'),
        }));
      });
    });

    it('点击"配置模型"自动填入并发送', async () => {
      const { getByText } = render(<HelperCard />);
      fireEvent.press(getByText(/配置模型/));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
          initialMessage: expect.stringContaining('模型'),
        }));
      });
    });

    it('点击"查看状态"自动填入并发送', async () => {
      const { getByText } = render(<HelperCard />);
      fireEvent.press(getByText(/查看状态/));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Chat', expect.objectContaining({
          initialMessage: expect.stringContaining('状态'),
        }));
      });
    });
  });

  // ========== 导航 ==========

  describe('导航', () => {
    it('点击历史按钮跳转到历史页面', () => {
      const { getByTestId } = render(<HelperCard />);
      fireEvent.press(getByTestId('helper-history-btn'));
      expect(mockNavigate).toHaveBeenCalledWith('HelperHistory');
    });

    it('创建会话失败时不崩溃', async () => {
      const { helperSession } = require('../../services/helper');
      helperSession.ensureHelperSession.mockRejectedValueOnce(new Error('Sidecar offline'));

      const { getByPlaceholderText } = render(<HelperCard />);
      const input = getByPlaceholderText(/告诉小助理想做什么/);

      fireEvent.changeText(input, '测试');
      fireEvent(input, 'submitEditing');

      // 不应崩溃
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });
});
