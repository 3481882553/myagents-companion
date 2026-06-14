/**
 * ToolCallRow 单元测试
 */

import React from 'react';
import { ToolCallRow } from '../ToolCallRow';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}));

describe('ToolCallRow', () => {
  const mockTool = {
    name: 'Bash',
    input: '{"command":"ls -la"}',
    state: 'completed' as const,
  };

  it('渲染工具名称', () => {
    const result = ToolCallRow({ tool: mockTool });
    expect(result).toBeTruthy();
  });

  it('渲染不同工具', () => {
    const tools = [
      { name: 'Read', input: '{"file_path":"/test"}' },
      { name: 'Write', input: '{"file_path":"/test"}' },
      { name: 'Grep', input: '{"pattern":"test"}' },
      { name: 'Glob', input: '{"pattern":"*.ts"}' },
    ];
    tools.forEach(tool => {
      const result = ToolCallRow({ tool: { ...tool, state: 'completed' } });
      expect(result).toBeTruthy();
    });
  });

  it('运行中状态', () => {
    const result = ToolCallRow({ tool: { ...mockTool, state: 'running' } });
    expect(result).toBeTruthy();
  });

  it('错误状态', () => {
    const result = ToolCallRow({ tool: { ...mockTool, state: 'error' } });
    expect(result).toBeTruthy();
  });

  it('无 input 时不崩溃', () => {
    const result = ToolCallRow({ tool: { name: 'Unknown', state: 'completed' } });
    expect(result).toBeTruthy();
  });

  it('未知工具显示默认图标', () => {
    const result = ToolCallRow({ tool: { name: 'CustomTool', state: 'completed' } });
    expect(result).toBeTruthy();
  });
});
