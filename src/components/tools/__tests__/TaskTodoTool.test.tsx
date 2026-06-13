/**
 * TaskTodoTool 组件测试
 *
 * 覆盖：
 * - TaskCreate 渲染
 * - TaskUpdate 渲染（状态变更）
 * - TaskGet 渲染
 * - TaskList 渲染（清单视图）
 * - 空列表
 * - 加载中状态
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { TaskTodoTool } from '../TaskTodoTool';

function createTool(name: string, overrides?: Record<string, any>) {
  return {
    name,
    state: 'completed',
    parsedInput: {},
    result: null,
    ...overrides,
  };
}

describe('TaskTodoTool', () => {
  // ========== TaskCreate ==========

  describe('TaskCreate', () => {
    it('渲染任务标题', () => {
      const tool = createTool('TaskCreate', {
        parsedInput: { subject: '实现用户登录' },
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/实现用户登录/)).toBeTruthy();
    });

    it('无 subject 时显示默认文本', () => {
      const tool = createTool('TaskCreate', { parsedInput: {} });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/新任务|New task/)).toBeTruthy();
    });

    it('显示创建图标', () => {
      const tool = createTool('TaskCreate', {
        parsedInput: { subject: '测试任务' },
      });
      const { getByTestId } = render(<TaskTodoTool tool={tool} />);
      expect(getByTestId('task-create-icon')).toBeTruthy();
    });
  });

  // ========== TaskUpdate ==========

  describe('TaskUpdate', () => {
    it('渲染 in_progress 状态', () => {
      const tool = createTool('TaskUpdate', {
        parsedInput: { subject: '实现登录', status: 'in_progress' },
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/开始|Start/)).toBeTruthy();
    });

    it('渲染 completed 状态', () => {
      const tool = createTool('TaskUpdate', {
        parsedInput: { subject: '实现登录', status: 'completed' },
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/完成|Done/)).toBeTruthy();
    });

    it('渲染 deleted 状态', () => {
      const tool = createTool('TaskUpdate', {
        parsedInput: { subject: '废弃功能', status: 'deleted' },
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/删除|Drop/)).toBeTruthy();
    });

    it('无 status 时显示默认更新文本', () => {
      const tool = createTool('TaskUpdate', {
        parsedInput: { subject: '某任务' },
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/更新|Update/)).toBeTruthy();
    });
  });

  // ========== TaskGet ==========

  describe('TaskGet', () => {
    it('显示任务详情', () => {
      const tool = createTool('TaskGet', {
        parsedInput: { task_id: 'task-1' },
        result: JSON.stringify({
          id: 'task-1',
          subject: '实现登录',
          status: 'in_progress',
          content: '需要实现 OAuth2.0 登录流程',
        }),
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/实现登录/)).toBeTruthy();
    });

    it('加载中显示加载文本', () => {
      const tool = createTool('TaskGet', {
        parsedInput: { task_id: 'task-1' },
        state: 'running',
        result: null,
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/加载|loading/i)).toBeTruthy();
    });
  });

  // ========== TaskList ==========

  describe('TaskList', () => {
    it('渲染任务清单', () => {
      const tool = createTool('TaskList', {
        result: JSON.stringify([
          { id: 't1', content: '任务一', status: 'completed' },
          { id: 't2', content: '任务二', status: 'in_progress' },
          { id: 't3', content: '任务三', status: 'pending' },
        ]),
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText('任务一')).toBeTruthy();
      expect(getByText('任务二')).toBeTruthy();
      expect(getByText('任务三')).toBeTruthy();
    });

    it('已完成任务显示勾选状态', () => {
      const tool = createTool('TaskList', {
        result: JSON.stringify([
          { id: 't1', content: '已完成任务', status: 'completed' },
        ]),
      });
      const { getByTestId } = render(<TaskTodoTool tool={tool} />);
      expect(getByTestId('task-checkbox-t1')).toBeTruthy();
    });

    it('空列表显示空状态', () => {
      const tool = createTool('TaskList', {
        result: JSON.stringify([]),
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/暂无任务|No tasks/)).toBeTruthy();
    });

    it('加载中显示加载文本', () => {
      const tool = createTool('TaskList', {
        state: 'running',
        result: null,
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/加载|loading/i)).toBeTruthy();
    });

    it('显示进度统计', () => {
      const tool = createTool('TaskList', {
        result: JSON.stringify([
          { id: 't1', content: '任务一', status: 'completed' },
          { id: 't2', content: '任务二', status: 'in_progress' },
          { id: 't3', content: '任务三', status: 'pending' },
        ]),
      });
      const { getByText } = render(<TaskTodoTool tool={tool} />);
      expect(getByText(/1\/3|1 of 3/)).toBeTruthy();
    });
  });

  // ========== 边界情况 ==========

  describe('边界情况', () => {
    it('未知工具名不崩溃', () => {
      const tool = createTool('UnknownTaskTool', { parsedInput: {} });
      expect(() => render(<TaskTodoTool tool={tool} />)).not.toThrow();
    });

    it('parsedInput 为 undefined 不崩溃', () => {
      const tool = createTool('TaskCreate', { parsedInput: undefined });
      expect(() => render(<TaskTodoTool tool={tool} />)).not.toThrow();
    });

    it('result 为非法 JSON 不崩溃', () => {
      const tool = createTool('TaskList', { result: 'not json' });
      expect(() => render(<TaskTodoTool tool={tool} />)).not.toThrow();
    });
  });
});
