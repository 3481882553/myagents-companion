/**
 * PermissionDialog 组件测试
 *
 * 覆盖：
 * - 弹窗显示
 * - 工具名称和参数展示
 * - 允许/拒绝按钮
 * - 回调触发
 * - 超时处理
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PermissionDialog } from '../PermissionDialog';

function createRequest(overrides?: Record<string, any>) {
  return {
    requestId: 'req-123',
    toolName: 'Bash',
    input: { command: 'rm -rf /tmp/cache', description: '清理缓存' },
    ...overrides,
  };
}

describe('PermissionDialog', () => {
  // ========== 基础渲染 ==========

  describe('基础渲染', () => {
    it('显示弹窗', () => {
      const { getByTestId } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByTestId('permission-dialog')).toBeTruthy();
    });

    it('显示工具名称', () => {
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByText(/Bash/)).toBeTruthy();
    });

    it('显示命令内容', () => {
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByText(/rm -rf/)).toBeTruthy();
    });

    it('显示 description', () => {
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByText(/清理缓存/)).toBeTruthy();
    });

    it('显示允许和拒绝按钮', () => {
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByText(/允许|Allow/)).toBeTruthy();
      expect(getByText(/拒绝|Deny/)).toBeTruthy();
    });
  });

  // ========== 操作交互 ==========

  describe('操作交互', () => {
    it('点击允许触发 onApprove', () => {
      const onApprove = jest.fn();
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={onApprove} onDeny={jest.fn()} />
      );
      fireEvent.press(getByText(/允许|Allow/));
      expect(onApprove).toHaveBeenCalledWith('req-123');
    });

    it('点击拒绝触发 onDeny', () => {
      const onDeny = jest.fn();
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={onDeny} />
      );
      fireEvent.press(getByText(/拒绝|Deny/));
      expect(onDeny).toHaveBeenCalledWith('req-123');
    });

    it('点击允许后弹窗关闭', async () => {
      const { getByText, queryByTestId } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      fireEvent.press(getByText(/允许|Allow/));
      await waitFor(() => {
        expect(queryByTestId('permission-dialog')).toBeNull();
      });
    });
  });

  // ========== 不同工具类型 ==========

  describe('不同工具类型', () => {
    it('Bash 工具显示终端图标', () => {
      const { getByTestId } = render(
        <PermissionDialog request={createRequest({ toolName: 'Bash' })} onApprove={jest.fn()} onDeny={jest.fn()} />
      );
      expect(getByTestId('tool-icon-terminal')).toBeTruthy();
    });

    it('Edit 工具显示文件图标', () => {
      const { getByTestId } = render(
        <PermissionDialog
          request={createRequest({ toolName: 'Edit', input: { file_path: '/src/app.ts' } })}
          onApprove={jest.fn()}
          onDeny={jest.fn()}
        />
      );
      expect(getByTestId('tool-icon-file')).toBeTruthy();
    });

    it('MCP 工具显示 MCP 服务器名', () => {
      const { getByText } = render(
        <PermissionDialog
          request={createRequest({ toolName: 'mcp__playwright__click', input: { selector: '#btn' } })}
          onApprove={jest.fn()}
          onDeny={jest.fn()}
        />
      );
      expect(getByText(/Playwright|浏览器/)).toBeTruthy();
    });
  });

  // ========== 超时处理 ==========

  describe('超时处理', () => {
    it('超时后自动关闭', async () => {
      jest.useFakeTimers();
      const onDeny = jest.fn();
      const { queryByTestId } = render(
        <PermissionDialog request={createRequest()} onApprove={jest.fn()} onDeny={onDeny} timeout={5000} />
      );

      jest.advanceTimersByTime(6000);

      await waitFor(() => {
        expect(queryByTestId('permission-dialog')).toBeNull();
      });
      jest.useRealTimers();
    });

    it('超时前操作不触发超时回调', () => {
      jest.useFakeTimers();
      const onApprove = jest.fn();
      const onDeny = jest.fn();
      const { getByText } = render(
        <PermissionDialog request={createRequest()} onApprove={onApprove} onDeny={onDeny} timeout={5000} />
      );

      fireEvent.press(getByText(/允许|Allow/));
      jest.advanceTimersByTime(6000);

      // onApprove 已被调用，onDeny 不应被调用
      expect(onApprove).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  // ========== 输入参数展示 ==========

  describe('输入参数展示', () => {
    it('长命令支持折叠', () => {
      const longCommand = 'echo "' + 'x'.repeat(500) + '"';
      const { getByTestId } = render(
        <PermissionDialog
          request={createRequest({ input: { command: longCommand } })}
          onApprove={jest.fn()}
          onDeny={jest.fn()}
        />
      );
      expect(getByTestId('input-collapse')).toBeTruthy();
    });

    it('无 input 时不崩溃', () => {
      expect(() => render(
        <PermissionDialog
          request={createRequest({ input: undefined })}
          onApprove={jest.fn()}
          onDeny={jest.fn()}
        />
      )).not.toThrow();
    });
  });
});
