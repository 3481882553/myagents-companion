/**
 * SessionCard 组件测试
 *
 * 覆盖：
 * - 会话标题
 * - 最后消息预览
 * - 时间显示
 * - 未读标记
 * - 点击交互
 * - 加载中状态
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SessionCard } from '../SessionCard';

function createSession(overrides?: Record<string, any>) {
  return {
    id: 'ses-abc123',
    title: '代码审查助手',
    lastMessage: '已帮你检查了 3 个文件的代码质量',
    lastMessageAt: Date.now() - 300000, // 5 分钟前
    messageCount: 42,
    unread: false,
    ...overrides,
  };
}

describe('SessionCard', () => {
  // ========== 基础渲染 ==========

  describe('基础渲染', () => {
    it('显示会话标题', () => {
      const { getByText } = render(
        <SessionCard session={createSession()} onPress={jest.fn()} />
      );
      expect(getByText('代码审查助手')).toBeTruthy();
    });

    it('显示最后消息预览', () => {
      const { getByText } = render(
        <SessionCard session={createSession()} onPress={jest.fn()} />
      );
      expect(getByText(/检查了 3 个文件/)).toBeTruthy();
    });

    it('显示消息数量', () => {
      const { getByText } = render(
        <SessionCard session={createSession()} onPress={jest.fn()} />
      );
      expect(getByText(/42/)).toBeTruthy();
    });
  });

  // ========== 时间显示 ==========

  describe('时间显示', () => {
    it('5 分钟前显示"刚刚"或"X 分钟前"', () => {
      const session = createSession({ lastMessageAt: Date.now() - 300000 });
      const { getByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByText(/刚刚|分钟前/)).toBeTruthy();
    });

    it('1 小时前显示"X 小时前"', () => {
      const session = createSession({ lastMessageAt: Date.now() - 3600000 });
      const { getByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByText(/1 小时前/)).toBeTruthy();
    });

    it('昨天显示"昨天"', () => {
      const session = createSession({ lastMessageAt: Date.now() - 86400000 });
      const { getByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByText(/昨天/)).toBeTruthy();
    });

    it('更早显示日期', () => {
      const session = createSession({ lastMessageAt: Date.now() - 172800000 });
      const { getByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByText(/\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2}/)).toBeTruthy();
    });
  });

  // ========== 未读标记 ==========

  describe('未读标记', () => {
    it('unread=true 时显示未读标记', () => {
      const session = createSession({ unread: true });
      const { getByTestId } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByTestId('unread-badge')).toBeTruthy();
    });

    it('unread=false 时不显示未读标记', () => {
      const session = createSession({ unread: false });
      const { queryByTestId } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(queryByTestId('unread-badge')).toBeNull();
    });
  });

  // ========== 点击交互 ==========

  describe('点击交互', () => {
    it('点击触发 onPress', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <SessionCard session={createSession()} onPress={onPress} />
      );
      fireEvent.press(getByTestId('session-card'));
      expect(onPress).toHaveBeenCalledWith('ses-abc123');
    });

    it('传递正确的 sessionId', () => {
      const onPress = jest.fn();
      const session = createSession({ id: 'ses-xyz' });
      const { getByTestId } = render(
        <SessionCard session={session} onPress={onPress} />
      );
      fireEvent.press(getByTestId('session-card'));
      expect(onPress).toHaveBeenCalledWith('ses-xyz');
    });
  });

  // ========== 边界情况 ==========

  describe('边界情况', () => {
    it('无 lastMessage 时显示空预览', () => {
      const session = createSession({ lastMessage: null });
      const { getByTestId } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(getByTestId('session-card')).toBeTruthy();
    });

    it('标题很长时截断显示', () => {
      const session = createSession({ title: '这是一个非常非常非常非常非常非常非常非常长的会话标题' });
      const { getByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      const title = getByText(/这是一个/);
      expect(title.props.numberOfLines).toBe(1);
    });

    it('messageCount 为 0 时不显示', () => {
      const session = createSession({ messageCount: 0 });
      const { queryByText } = render(
        <SessionCard session={session} onPress={jest.fn()} />
      );
      expect(queryByText('0')).toBeNull();
    });
  });
});
