/**
 * BashTool 组件测试
 *
 * 覆盖：
 * - 命令渲染
 * - 输出渲染
 * - 折叠/展开交互
 * - 运行中状态
 * - 长输出滚动
 * - 复制按钮
 * - exitCode 显示
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BashTool } from '../BashTool';

// Mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

function createTool(overrides?: Record<string, any>) {
  return {
    name: 'Bash',
    state: 'completed',
    args: { command: 'ls -la', description: 'List files' },
    result: 'total 0\ndrwxr-xr-x  5 user  staff  160 Jan  1 00:00 .\ndrwxr-xr-x  3 user  staff   96 Jan  1 00:00 ..\n-rw-r--r--  1 user  staff    0 Jan  1 00:00 file1.txt\n-rw-r--r--  1 user  staff    0 Jan  1 00:00 file2.txt',
    ...overrides,
  };
}

describe('BashTool', () => {
  // ========== 基础渲染 ==========

  describe('基础渲染', () => {
    it('渲染命令文本', () => {
      const { getByText } = render(<BashTool toolInvocation={createTool()} />);
      expect(getByText('ls -la')).toBeTruthy();
    });

    it('渲染 description', () => {
      const { getByText } = render(<BashTool toolInvocation={createTool()} />);
      expect(getByText('List files')).toBeTruthy();
    });

    it('渲染输出内容', () => {
      const { getByText } = render(<BashTool toolInvocation={createTool()} />);
      expect(getByText(/file1\.txt/)).toBeTruthy();
      expect(getByText(/file2\.txt/)).toBeTruthy();
    });

    it('无 description 时不崩溃', () => {
      const tool = createTool({ args: { command: 'echo hello' } });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText('echo hello')).toBeTruthy();
    });

    it('无输出时显示空状态', () => {
      const tool = createTool({ result: '' });
      const { queryByText } = render(<BashTool toolInvocation={tool} />);
      // 不应有文件内容
      expect(queryByText(/file1\.txt/)).toBeNull();
    });
  });

  // ========== 折叠/展开 ==========

  describe('折叠/展开', () => {
    it('默认展开显示输出', () => {
      const { getByText } = render(<BashTool toolInvocation={createTool()} />);
      expect(getByText(/file1\.txt/)).toBeTruthy();
    });

    it('点击折叠后隐藏输出', () => {
      const { getByTestId, queryByText } = render(<BashTool toolInvocation={createTool()} />);
      const toggle = getByTestId('bash-toggle');
      fireEvent.press(toggle);
      expect(queryByText(/file1\.txt/)).toBeNull();
    });

    it('再次点击展开显示输出', () => {
      const { getByTestId, getByText } = render(<BashTool toolInvocation={createTool()} />);
      const toggle = getByTestId('bash-toggle');
      fireEvent.press(toggle); // 折叠
      fireEvent.press(toggle); // 展开
      expect(getByText(/file1\.txt/)).toBeTruthy();
    });

    it('折叠时命令仍然可见', () => {
      const { getByTestId, getByText } = render(<BashTool toolInvocation={createTool()} />);
      fireEvent.press(getByTestId('bash-toggle'));
      expect(getByText('ls -la')).toBeTruthy();
    });
  });

  // ========== 运行中状态 ==========

  describe('运行中状态', () => {
    it('state=running 时显示加载指示器', () => {
      const tool = createTool({ state: 'running', result: undefined });
      const { getByTestId } = render(<BashTool toolInvocation={tool} />);
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('state=running 时无输出', () => {
      const tool = createTool({ state: 'running', result: undefined });
      const { queryByText } = render(<BashTool toolInvocation={tool} />);
      expect(queryByText(/file1\.txt/)).toBeNull();
    });

    it('state=running 时命令可见', () => {
      const tool = createTool({ state: 'running', result: undefined });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText('ls -la')).toBeTruthy();
    });
  });

  // ========== 错误状态 ==========

  describe('错误状态', () => {
    it('exitCode 非 0 时显示错误样式', () => {
      const tool = createTool({
        result: 'Permission denied',
        metadata: { exitCode: 1, duration: 100 },
      });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText('Permission denied')).toBeTruthy();
    });

    it('显示 exitCode', () => {
      const tool = createTool({
        metadata: { exitCode: 127, duration: 50 },
      });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText(/127/)).toBeTruthy();
    });
  });

  // ========== 长输出 ==========

  describe('长输出', () => {
    it('1000+ 行输出支持滚动', () => {
      const longOutput = Array.from({ length: 1000 }, (_, i) => `line ${i}`).join('\n');
      const tool = createTool({ result: longOutput });
      const { getByTestId } = render(<BashTool toolInvocation={tool} />);
      expect(getByTestId('bash-output-scroll')).toBeTruthy();
    });

    it('长输出中关键内容可见', () => {
      const longOutput = Array.from({ length: 1000 }, (_, i) => `line ${i}`).join('\n');
      const tool = createTool({ result: longOutput });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText(/line 0/)).toBeTruthy();
    });
  });

  // ========== 复制功能 ==========

  describe('复制功能', () => {
    it('点击复制按钮复制输出内容', async () => {
      const Clipboard = require('@react-native-clipboard/clipboard');
      const { getByTestId } = render(<BashTool toolInvocation={createTool()} />);
      const copyBtn = getByTestId('bash-copy');
      fireEvent.press(copyBtn);
      await waitFor(() => {
        expect(Clipboard.setString).toHaveBeenCalledWith(expect.stringContaining('file1.txt'));
      });
    });

    it('运行中时复制按钮禁用', () => {
      const tool = createTool({ state: 'running', result: undefined });
      const { queryByTestId } = render(<BashTool toolInvocation={tool} />);
      expect(queryByTestId('bash-copy')).toBeNull();
    });
  });

  // ========== 元数据显示 ==========

  describe('元数据', () => {
    it('显示执行时长', () => {
      const tool = createTool({ metadata: { duration: 1500, exitCode: 0 } });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText(/1\.5s|1500ms/)).toBeTruthy();
    });

    it('显示 cwd', () => {
      const tool = createTool({ metadata: { cwd: '/home/user/project', exitCode: 0 } });
      const { getByText } = render(<BashTool toolInvocation={tool} />);
      expect(getByText(/project/)).toBeTruthy();
    });
  });
});
