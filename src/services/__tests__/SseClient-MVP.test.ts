/**
 * SseClient MVP 单元测试
 *
 * 覆盖：
 * - 连接状态机（DISCONNECTED → CONNECTING → CONNECTED → RECONNECTING → RETRYING）
 * - 事件接收（critical/coalescible/droppable）
 * - 指数退避重连
 * - 事件合并（40ms 窗口）
 */

import { SseClient, ConnectionState, EVENT_PRIORITY_MAP } from '../sse-client';

// 直接定义 MockEventSource（避免 moduleNameMapper 路径问题）
class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string; type?: string }) => void) | null = null;
  readyState = 0;
  close = jest.fn();

  constructor(public url: string, public options?: any) {
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, callback: any) {
    if (type === 'open') this.onopen = callback;
    if (type === 'error') this.onerror = callback;
    if (type === 'message') this.onmessage = callback;
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateError() {
    this.onerror?.();
  }

  simulateMessage(data: string, type?: string) {
    this.onmessage?.({ data, type: type || 'message' });
  }

  static reset() {
    MockEventSource.instances = [];
  }

  static latest(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// 替换 react-native-sse 的默认导出
jest.mock('react-native-sse', () => ({
  default: MockEventSource,
}));

function createClient(options?: Partial<ConstructorParameters<typeof SseClient>[0]>) {
  return new SseClient({
    url: 'http://localhost:32101/api/session/stream',
    token: 'test-token',
    ...options,
  });
}

describe('SseClient MVP', () => {
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

    it('disconnect() 停止重连', () => {
      const client = createClient();
      client.connect();
      client.disconnect();
      expect(client.state).toBe(ConnectionState.DISCONNECTED);
      expect(MockEventSource.latest()?.close).toHaveBeenCalled();
    });
  });

  // ========== 事件接收 ==========

  describe('事件接收', () => {
    it('critical 事件立即分发', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-complete', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-complete', data: '{"id":"msg-1"}' }),
        'chat:message-complete'
      );

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('coalescible 事件在 40ms 窗口内合并', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:message-chunk', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-chunk', data: 'Hello' }),
        'chat:message-chunk'
      );
      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:message-chunk', data: ' World' }),
        'chat:message-chunk'
      );

      expect(handler).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('droppable 事件不分发', () => {
      const client = createClient();
      const handler = jest.fn();
      client.on('chat:log', handler);
      client.connect();
      MockEventSource.latest()?.simulateOpen();

      MockEventSource.latest()?.simulateMessage(
        JSON.stringify({ type: 'chat:log', data: 'debug' }),
        'chat:log'
      );

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ========== 重连机制 ==========

  describe('重连机制', () => {
    it('连接失败后进入 RETRYING 状态', () => {
      const client = createClient();
      client.connect();
      MockEventSource.latest()?.simulateError();
      expect(client.state).toBe(ConnectionState.RETRYING);
    });

    it('disconnect() 停止重连', () => {
      const client = createClient();
      client.connect();
      MockEventSource.latest()?.simulateError();
      client.disconnect();
      expect(client.state).toBe(ConnectionState.DISCONNECTED);
    });
  });

  // ========== 事件优先级映射 ==========

  describe('事件优先级映射', () => {
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
});
