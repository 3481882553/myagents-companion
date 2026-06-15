/**
 * EventCoalescer 单元测试
 *
 * 覆盖：
 * - 40ms 时间窗口合并
 * - Delta 拼接策略
 * - 不同类型事件独立合并
 * - 跨窗口事件不合并
 */

import { EventCoalescer } from '../event-coalescer';

describe('EventCoalescer', () => {
  let coalescer: EventCoalescer;
  let onEvent: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onEvent = jest.fn();
    coalescer = new EventCoalescer(onEvent);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== 合并逻辑 ==========

  describe('合并逻辑', () => {
    it('单个事件在 40ms 后触发', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'Hello' } });
      expect(onEvent).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chat:message-chunk' })
      );
    });

    it('多个同类型事件在 40ms 内合并', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'Hello' } });
      coalescer.push({ type: 'chat:message-chunk', data: { text: ' ' } });
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'World' } });

      jest.advanceTimersByTime(50);

      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chat:message-chunk',
          data: expect.objectContaining({ text: 'Hello World' }),
        })
      );
    });

    it('不同类型事件各自独立合并', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'A' } });
      coalescer.push({ type: 'chat:thinking-chunk', data: { text: 'B' } });

      jest.advanceTimersByTime(50);

      expect(onEvent).toHaveBeenCalledTimes(2);
    });

    it('跨窗口事件不合并', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'A' } });
      jest.advanceTimersByTime(50);

      coalescer.push({ type: 'chat:message-chunk', data: { text: 'B' } });
      jest.advanceTimersByTime(50);

      expect(onEvent).toHaveBeenCalledTimes(2);
    });
  });

  // ========== Delta 拼接 ==========

  describe('Delta 拼接', () => {
    it('text 字段拼接', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'Hello' } });
      coalescer.push({ type: 'chat:message-chunk', data: { text: ' World' } });

      jest.advanceTimersByTime(50);

      const call = onEvent.mock.calls[0][0];
      expect(call.data.text).toBe('Hello World');
    });

    it('空 text 处理', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: '' } });
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'World' } });

      jest.advanceTimersByTime(50);

      const call = onEvent.mock.calls[0][0];
      expect(call.data.text).toBe('World');
    });

    it('大量 delta 正确拼接', () => {
      for (let i = 0; i < 100; i++) {
        coalescer.push({ type: 'chat:message-chunk', data: { text: `${i}` } });
      }

      jest.advanceTimersByTime(50);

      const call = onEvent.mock.calls[0][0];
      expect(call.data.text).toBe(Array.from({ length: 100 }, (_, i) => i).join(''));
    });
  });

  // ========== 重置 ==========

  describe('重置', () => {
    it('reset 清空缓冲区', () => {
      coalescer.push({ type: 'chat:message-chunk', data: { text: 'Hello' } });
      coalescer.reset();
      jest.advanceTimersByTime(50);
      expect(onEvent).not.toHaveBeenCalled();
    });
  });
});
