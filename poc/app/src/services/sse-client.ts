/**
 * SseClient — SSE 客户端
 *
 * 职责：连接桌面端 Sidecar，接收 SSE 事件流
 * 参考详细设计 §3.1 状态机
 */

import { EventCoalescer, SSEEvent } from './event-coalescer';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  RETRYING = 'retrying',
}

// 事件优先级映射（源码验证：src/server/sse.ts 第 64-138 行）
export const EVENT_PRIORITY_MAP: Record<string, string> = {
  // coalescible — 7 个
  'chat:message-chunk': 'coalescible',
  'chat:thinking-chunk': 'coalescible',
  'chat:tool-input-delta': 'coalescible',
  'chat:tool-result-delta': 'coalescible',
  'chat:subagent-tool-input-delta': 'coalescible',
  'chat:subagent-tool-result-delta': 'coalescible',
  'chat:context-usage': 'coalescible',

  // droppable — 4 个
  'chat:log': 'droppable',
  'chat:logs': 'droppable',
  'chat:debug-message': 'droppable',
  'chat:runtime-diagnostics': 'droppable',

  // critical — 41 个（显式注册）
  'chat:system-init': 'critical',
  'chat:system-status': 'critical',
  'chat:status': 'critical',
  'chat:init': 'critical',
  'chat:api-retry': 'critical',
  'chat:attachments-filtered': 'critical',
  'chat:attachments-fallback': 'critical',
  'chat:thinking-start': 'critical',
  'chat:content-block-stop': 'critical',
  'chat:message-sdk-uuid': 'critical',
  'chat:message-replay': 'critical',
  'chat:message-stopped': 'critical',
  'chat:message-complete': 'critical',
  'chat:message-error': 'critical',
  'chat:agent-error': 'critical',
  'chat:tool-use-start': 'critical',
  'chat:tool-result-start': 'critical',
  'chat:tool-result-complete': 'critical',
  'chat:tool-attachment-update': 'critical',
  'chat:server-tool-use-start': 'critical',
  'chat:subagent-tool-use': 'critical',
  'chat:subagent-tool-result-start': 'critical',
  'chat:subagent-tool-result-complete': 'critical',
  'chat:permission-mode-changed': 'critical',
  'chat:task-notification': 'critical',
  'chat:task-started': 'critical',
  'permission:request': 'critical',
  'ask-user-question:request': 'critical',
  'ask-user-question:expired': 'critical',
  'exit-plan-mode:request': 'critical',
  'exit-plan-mode:expired': 'critical',
  'enter-plan-mode:request': 'critical',
  'enter-plan-mode:expired': 'critical',
  'cron:task-exit-requested': 'critical',
  'mcp:oauth-expired': 'critical',
  'config:changed': 'critical',
  'plugin:install-progress': 'critical',
  'plugins:changed': 'critical',
  'queue:added': 'critical',
  'queue:started': 'critical',
  'queue:cancelled': 'critical',
};

// JSON 事件集合（data 需要解析为对象）
const JSON_EVENTS = new Set([
  'chat:init', 'chat:message-replay', 'chat:thinking-start',
  'chat:tool-use-start', 'chat:tool-input-delta', 'chat:content-block-stop',
  'chat:tool-result-start', 'chat:tool-result-delta', 'chat:tool-result-complete',
  'chat:tool-attachment-update', 'chat:system-init', 'chat:system-status',
  'chat:status', 'chat:agent-error', 'permission:request',
  'ask-user-question:request', 'ask-user-question:expired',
  'exit-plan-mode:request', 'exit-plan-mode:expired',
  'enter-plan-mode:request', 'enter-plan-mode:expired',
  'chat:task-notification', 'chat:task-started',
  'config:changed', 'chat:permission-mode-changed',
  'chat:session-title-changed', 'chat:message-sdk-uuid',
  'chat:attachments-filtered', 'chat:attachments-fallback',
  'chat:api-retry', 'cron:task-exit-requested', 'mcp:oauth-expired',
  'plugin:install-progress', 'plugins:changed',
  'queue:added', 'queue:started', 'queue:cancelled',
]);

export interface SseClientOptions {
  url: string;
  token?: string;
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
}

export class SseClient {
  private _state: ConnectionState = ConnectionState.DISCONNECTED;
  private _retryDelay: number;
  private retryCount = 0;
  private eventSource: any = null;
  private listeners: Map<string, ((event: SSEEvent) => void)[]> = new Map();
  private coalescer: EventCoalescer;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private options: SseClientOptions) {
    this._retryDelay = options.initialRetryDelay || 500;
    this.coalescer = new EventCoalescer((event) => this.dispatchEvent(event));
  }

  get state() {
    return this._state;
  }

  get retryDelay() {
    return this._retryDelay;
  }

  connect() {
    if (this._state === ConnectionState.CONNECTED || this._state === ConnectionState.CONNECTING) {
      return;
    }

    this._state = ConnectionState.CONNECTING;
    this.createEventSource();
  }

  disconnect() {
    this._state = ConnectionState.DISCONNECTED;
    this.coalescer.reset();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  on(eventType: string, callback: (event: SSEEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: SSEEvent) => void) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private createEventSource() {
    const headers = this.options.token
      ? { Authorization: `Bearer ${this.options.token}` }
      : {};

    // react-native-sse 的 EventSource 构造函数
    const EventSource = require('react-native-sse').default;
    this.eventSource = new EventSource(this.options.url, {
      headers,
    });

    this.eventSource.addEventListener('open', () => {
      this._state = ConnectionState.CONNECTED;
      this.retryCount = 0;
      this._retryDelay = this.options.initialRetryDelay || 500;
    });

    this.eventSource.addEventListener('message', (event: any) => {
      this.handleMessage(event);
    });

    this.eventSource.addEventListener('error', () => {
      this.handleError();
    });
  }

  private handleMessage(rawEvent: any) {
    const eventType = rawEvent.type || 'unknown';
    const rawData = rawEvent.data || '';

    // 解析 data
    let data: any = rawData;
    if (JSON_EVENTS.has(eventType) && typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch {
        // 解析失败，保持原始字符串
      }
    }

    const event: SSEEvent = { type: eventType, data };

    // 按优先级处理
    const priority = EVENT_PRIORITY_MAP[eventType] || 'critical';

    switch (priority) {
      case 'critical':
        this.dispatchEvent(event);
        break;
      case 'coalescible':
        this.coalescer.push(event);
        break;
      case 'droppable':
        // 忽略
        break;
      default:
        this.dispatchEvent(event);
    }
  }

  private handleError() {
    if (this._state === ConnectionState.DISCONNECTED) {
      return;
    }

    this._state = ConnectionState.RETRYING;
    this.retryCount++;

    if (this.retryCount > (this.options.maxRetries || 10)) {
      this._state = ConnectionState.DISCONNECTED;
      return;
    }

    // 指数退避
    this._retryDelay = Math.min(
      this._retryDelay * 2,
      this.options.maxRetryDelay || 30000
    );

    this.reconnectTimer = setTimeout(() => {
      this._state = ConnectionState.CONNECTING;
      this.createEventSource();
    }, this._retryDelay);
  }

  private dispatchEvent(event: SSEEvent) {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
  }
}
