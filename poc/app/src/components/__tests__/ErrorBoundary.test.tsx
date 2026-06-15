/**
 * ErrorBoundary 单元测试
 * v0.2 架构升级 — 错误处理
 *
 * 覆盖：
 * - getDerivedStateFromError 静态方法
 * - componentDidCatch 日志记录
 * - 实例化与默认状态
 * - handleRetry 重置状态
 * - 不同错误类型
 */

import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ========== 静态方法 ==========

  describe('getDerivedStateFromError', () => {
    it('存在且是函数', () => {
      expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
      expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
    });

    it('返回 hasError: true 和 error 对象', () => {
      const error = new Error('测试错误');
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state).toEqual({ hasError: true, error });
    });

    it('处理 TypeError', () => {
      const error = new TypeError('类型错误');
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state.error).toBe(error);
      expect(state.hasError).toBe(true);
    });

    it('处理 RangeError', () => {
      const error = new RangeError('范围错误');
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state.error).toBe(error);
      expect(state.hasError).toBe(true);
    });

    it('处理带 stack 的错误', () => {
      const error = new Error('带栈错误');
      error.stack = 'Error: 带栈错误\n    at Test (test.ts:1:1)';
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state.error?.stack).toContain('Test');
    });

    it('处理自定义错误名', () => {
      class CustomError extends Error {
        constructor(msg: string) { super(msg); this.name = 'CustomError'; }
      }
      const error = new CustomError('自定义');
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state.error).toBeInstanceOf(CustomError);
      expect(state.error?.name).toBe('CustomError');
    });
  });

  // ========== componentDidCatch ==========

  describe('componentDidCatch', () => {
    it('记录错误到 console.error', () => {
      const instance = new ErrorBoundary({ children: null });
      const error = new Error('组件崩溃');
      const errorInfo = { componentStack: '\n    at App\n    at View' };

      instance.componentDidCatch(error, errorInfo);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorBoundary]',
        error,
        errorInfo
      );
    });

    it('记录 TypeError', () => {
      const instance = new ErrorBoundary({ children: null });
      const error = new TypeError('类型不匹配');
      const errorInfo = { componentStack: '' };

      instance.componentDidCatch(error, errorInfo);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorBoundary]',
        error,
        errorInfo
      );
    });
  });

  // ========== 实例状态 ==========

  describe('默认状态', () => {
    it('初始状态 hasError 为 false', () => {
      const instance = new ErrorBoundary({ children: null });
      expect(instance.state).toEqual({ hasError: false, error: null });
    });

    it('handleRetry 重置 hasError 和 error', () => {
      const instance = new ErrorBoundary({ children: null });

      // 先手动设置错误状态
      instance.setState({ hasError: true, error: new Error('测试') });
      expect(instance.state.hasError).toBe(true);

      // 调用重试
      instance.handleRetry();
      expect(instance.state.hasError).toBe(false);
      expect(instance.state.error).toBeNull();
    });
  });
});
