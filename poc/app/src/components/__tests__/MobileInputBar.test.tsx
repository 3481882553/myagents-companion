/**
 * MobileInputBar 组件测试
 *
 * 覆盖：
 * - 输入框渲染
 * - 发送按钮
 * - 回车发送
 * - 空输入禁用
 * - 字符限制
 * - 禁用状态
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MobileInputBar } from '../MobileInputBar';

describe('MobileInputBar', () => {
  // ========== 基础渲染 ==========

  describe('基础渲染', () => {
    it('显示输入框', () => {
      const { getByPlaceholderText } = render(
        <MobileInputBar onSend={jest.fn()} />
      );
      expect(getByPlaceholderText(/输入消息|Type a message/)).toBeTruthy();
    });

    it('显示发送按钮', () => {
      const { getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} />
      );
      expect(getByTestId('send-button')).toBeTruthy();
    });
  });

  // ========== 发送交互 ==========

  describe('发送交互', () => {
    it('点击发送按钮触发 onSend', async () => {
      const onSend = jest.fn();
      const { getByPlaceholderText, getByTestId } = render(
        <MobileInputBar onSend={onSend} />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);

      fireEvent.changeText(input, '你好');
      fireEvent.press(getByTestId('send-button'));

      await waitFor(() => {
        expect(onSend).toHaveBeenCalledWith('你好');
      });
    });

    it('回车触发发送', async () => {
      const onSend = jest.fn();
      const { getByPlaceholderText } = render(
        <MobileInputBar onSend={onSend} />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);

      fireEvent.changeText(input, '测试消息');
      fireEvent(input, 'submitEditing');

      await waitFor(() => {
        expect(onSend).toHaveBeenCalledWith('测试消息');
      });
    });

    it('发送后清空输入框', async () => {
      const onSend = jest.fn();
      const { getByPlaceholderText, getByTestId } = render(
        <MobileInputBar onSend={onSend} />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);

      fireEvent.changeText(input, '发送测试');
      fireEvent.press(getByTestId('send-button'));

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });
  });

  // ========== 空输入处理 ==========

  describe('空输入处理', () => {
    it('空输入时发送按钮禁用', () => {
      const { getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} />
      );
      const sendBtn = getByTestId('send-button');
      expect(sendBtn.props.accessibilityState?.disabled).toBe(true);
    });

    it('纯空格输入时发送按钮禁用', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} />
      );
      fireEvent.changeText(getByPlaceholderText(/输入消息|Type a message/), '   ');
      const sendBtn = getByTestId('send-button');
      expect(sendBtn.props.accessibilityState?.disabled).toBe(true);
    });

    it('有内容时发送按钮启用', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} />
      );
      fireEvent.changeText(getByPlaceholderText(/输入消息|Type a message/), 'hello');
      const sendBtn = getByTestId('send-button');
      expect(sendBtn.props.accessibilityState?.disabled).toBe(false);
    });
  });

  // ========== 字符限制 ==========

  describe('字符限制', () => {
    it('超过 4000 字符时截断', () => {
      const { getByPlaceholderText } = render(
        <MobileInputBar onSend={jest.fn()} maxLength={4000} />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);
      const longText = 'x'.repeat(5000);
      fireEvent.changeText(input, longText);
      // 输入框不应接受超过 maxLength 的内容
      expect(input.props.value?.length).toBeLessThanOrEqual(4000);
    });

    it('显示字符计数（接近上限时）', () => {
      const { getByPlaceholderText, getByText } = render(
        <MobileInputBar onSend={jest.fn()} maxLength={4000} />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);
      fireEvent.changeText(input, 'x'.repeat(3900));
      expect(getByText(/3900|100 剩余/)).toBeTruthy();
    });
  });

  // ========== 禁用状态 ==========

  describe('禁用状态', () => {
    it('disabled 时输入框不可编辑', () => {
      const { getByPlaceholderText } = render(
        <MobileInputBar onSend={jest.fn()} disabled />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);
      expect(input.props.editable).toBe(false);
    });

    it('disabled 时发送按钮禁用', () => {
      const { getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} disabled />
      );
      expect(getByTestId('send-button').props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ========== 工具栏 ==========

  describe('工具栏', () => {
    it('显示代码块快捷按钮', () => {
      const { getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} showToolbar />
      );
      expect(getByTestId('toolbar-code')).toBeTruthy();
    });

    it('点击代码块按钮插入模板', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <MobileInputBar onSend={jest.fn()} showToolbar />
      );
      const input = getByPlaceholderText(/输入消息|Type a message/);
      fireEvent.press(getByTestId('toolbar-code'));
      expect(input.props.value).toContain('```');
    });
  });
});
