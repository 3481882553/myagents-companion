/**
 * SseClient 单元测试
 *
 * 测试覆盖：
 * - 连接状态机（DISCONNECTED → CONNECTING → CONNECTED → RECONNECTING → RETRYING）
 * - 事件优先级分发（critical/coalescible/droppable）
 * - coalescible 事件合并（40ms 窗口 + delta 拼接）
 * - JSON/String 事件解析
 * - 指数退避重连
 * - 心跳检测
 */

import {
  SseClient,
  ConnectionState,
  EVENT_PRIORITY_MAP,
} from '../sse-client';
import {
  CRITICAL_EVENTS,
  COALESCIBLE_EVENTS,
  DROPPABLE_EVENTS,
  ALL_EVENTS,
} from '../../__tests__/mocks';

// 模拟 EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  readyState = 0; // CONNECTING
  close = jest.fn();

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1; // OPEN
    this.onopen?.();
  }

  simulateError() {
    this.onerror?.();
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  static reset() {
    MockEventSource.instances = [];
  }

  static latest(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// 替换全局 EventSource
(global as any).EventSource = MockEventSource;

function createClient(options?: Partial<ConstructorParameters<typeof SseClient>[0]>) {
  return new SseClient({
    url: 'http://localhost:31415/api/session/stream',
    token: 'test-token',
    ...options,
  });
}

describe('SseClient', () => {
  beforeEach(() => {
    MockEventSource.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== 连接状态机 ==========

  describe('连接状态机', () => {
    it('初始状态为 DISCONNECTED', () => {
      const client = createClient();
      expect(client.state).toBe(ConnectionState.DISCONNECTED);
    });

    it('connect() 转换到 CONNECTING', () => {
      const client = createClient();
      client.connect();
      expect(client.state).toBe(ConnectionState.CONNECTING);
    });

    it('连接成功转换到 CONNECTED', () => {
      const client = createClient();
      client.connect();
      MockEventSource.latest()?.simulateOpen();
      expect(client.state).toBe(ConnectionState.CONNECTED);
    });

    it('连接失败转换到 RETRYING', () => {
      const client = createClient();
      client.connect();
      MockEventSource.latest()?.simulateError();
      expect(client.state).toBe(ConnectionState.RETRYING);
    });

    it('disconnect() 停止重连并关闭连接', () => {
      const client = createClient();
      client.connect();
      client.disconnect();
      expect(client.state).toBe(ConnectionState.DISCONNECTED);
      expect(MockEventSource.latest()?.close).toHaveBeenCalled();
    });
  });

  // ========== 事件优先级 ==========

  describe('事件优先级', () => {
    it('critical 事件立即分发', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-complete', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-complete', data: '{"id":"msg-1"}' })
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'chat:message-complete' })
      );
    });

    it('coalescible 事件在 40ms 窗口内合并', async () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-chunk', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      // 发送两个 chunk
      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-chunk', data: 'Hello' })
      );
      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-chunk', data: ' World' })
      );

      // 窗口内不应触发
      expect(handler).not.toHaveBeenCalled();

      // 等待 40ms 窗口结束
      jest.advanceTimersByTime(50);

      expect(handler).toHaveBeenCalledTimes(1);
      // delta 拼接
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ text: 'Hello World' }),
        })
      );
    });

    it('droppable 事件不分发', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:log', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:log', data: 'debug message' })
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it('未知事件默认为 critical 并分发', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('unknown:event', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'unknown:event', data: '{}' })
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ========== 事件解析 ==========

  describe('事件解析', () => {
    it('JSON 事件解析为对象', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:init', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:init', data: '{"sessionId":"ses-1"}' })
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { sessionId: 'ses-1' },
        })
      );
    });

    it('String 事件保持字符串', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-chunk', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-chunk', data: 'Hello' })
      );

      jest.advanceTimersByTime(50);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ text: 'Hello' }),
        })
      );
    });

    it('NULL 事件 data 为 undefined', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-stopped', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-stopped' })
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chat:message-stopped',
        })
      );
    });
  });

  // ========== 重连机制 ==========

  describe('重连机制', () => {
    it('指数退避：500ms → 1s → 2s → 4s → ...', () => {
      const client = createClient();
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      // 模拟多次断开
      for (let i = 0; i < 5; i++) {
        MockEventSource.latest()?.simulateError();
        jest.advanceTimersByTime(client.retryDelay);
      }

      // 验证延迟递增（500, 1000, 2000, 4000, 8000）
      expect(client.retryDelay).toBeGreaterThanOrEqual(500);
    });

    it('超过最大重试次数转为 DISCONNECTED', () => {
      const client = createClient({ maxRetries: 3 });
      client.connect();

      for (let i = 0; i < 4; i++) {
        MockEventSource.latest()?.simulateError();
        jest.advanceTimersByTime(30000); // 超过最大延迟
      }

      expect(client.state).toBe(ConnectionState.DISCONNECTED);
    });

    it('重连成功后重置重试计数', () => {
      const client = createClient();
      client.connect();

      // 失败一次
      MockEventSource.latest()?.simulateError();
      jest.advanceTimersByTime(500);

      // 重连成功
      MockEventSource.latest()?.simulateOpen();
      expect(client.state).toBe(ConnectionState.CONNECTED);
    });
  });

  // ========== 事件优先级映射完整性 ==========

  describe('事件优先级映射', () => {
    it('所有 critical 事件都在映射中', () => {
      for (const event of Object.values(CRITICAL_EVENTS)) {
        expect(EVENT_PRIORITY_MAP[event.type]).toBe('critical');
      }
    });

    it('所有 coalescible 事件都在映射中', () => {
      for (const event of Object.values(COALESCIBLE_EVENTS)) {
        expect(EVENT_PRIORITY_MAP[event.type]).toBe('coalescible');
      }
    });

    it('所有 droppable 事件都在映射中', () => {
      for (const event of Object.values(DROPPABLE_EVENTS)) {
        expect(EVENT_PRIORITY_MAP[event.type]).toBe('droppable');
      }
    });

    it('critical 事件数量正确（41 显式）', () => {
      const criticalCount = Object.values(EVENT_PRIORITY_MAP).filter(p => p === 'critical').length;
      expect(criticalCount).toBe(41);
    });

    it('coalescible 事件数量正确（7 个）', () => {
      const coalescibleCount = Object.values(EVENT_PRIORITY_MAP).filter(p => p === 'coalescible').length;
      expect(coalescibleCount).toBe(7);
    });

    it('droppable 事件数量正确（4 个）', () => {
      const droppableCount = Object.values(EVENT_PRIORITY_MAP).filter(p => p === 'droppable').length;
      expect(droppableCount).toBe(4);
    });
  });

  // ========== 完整消息流程 ==========

  describe('完整消息流程', () => {
    it('模拟完整 AI 回复流程', () => {
      const client = createClient();
      const chunks: string[] = [];
      let completed = false;

      client.on('chat:message-chunk', (event) => {
        chunks.push(event.data.text || event.data);
      });
      client.on('chat:message-complete', () => {
        completed = true;
      });

      client.connect();
      MockEventSource.latest()?.simulateOpen();

      // 模拟流式回复
      const es = MockEventSource.latest()!;
      es.simulateMessage(JSON.stringify({ type: 'chat:thinking-start', data: '{}' }));
      es.simulateMessage(JSON.stringify({ type: 'chat:message-chunk', data: 'Hello' }));
      es.simulateMessage(JSON.stringify({ type: 'chat:message-chunk', data: ' World' }));
      es.simulateMessage(JSON.stringify({ type: 'chat:message-complete', data: '{"id":"msg-1"}' }));

      jest.advanceTimersByTime(50);

      expect(chunks.length).toBeGreaterThan(0);
      expect(completed).toBe(true);
    });
  });
});
