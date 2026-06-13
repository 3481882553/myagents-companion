/**
 * EventCoalescer — SSE 事件合并器
 *
 * 职责：40ms 时间窗口内合并 coalescible 事件
 * 参考详细设计 §3.4
 */

export interface SSEEvent {
  type: string;
  data: any;
}

export class EventCoalescer {
  private buffer: Map<string, SSEEvent[]> = new Map();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly WINDOW_MS = 40;

  constructor(private onEvent: (event: SSEEvent) => void) {}

  push(event: SSEEvent) {
    const key = event.type;
    if (!this.buffer.has(key)) {
      this.buffer.set(key, []);
    }
    this.buffer.get(key)!.push(event);

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.WINDOW_MS);
    }
  }

  reset() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.buffer.clear();
  }

  private flush() {
    for (const [type, events] of this.buffer) {
      const merged = this.mergeEvents(type, events);
      this.onEvent(merged);
    }
    this.buffer.clear();
    this.timer = null;
  }

  private mergeEvents(type: string, events: SSEEvent[]): SSEEvent {
    if (events.length === 1) {
      return events[0];
    }

    // Delta 类型：拼接 text 字段
    if (type.endsWith('-chunk') || type.endsWith('-delta')) {
      const lastEvent = events[events.length - 1];
      const mergedText = events
        .map(e => {
          if (typeof e.data === 'string') return e.data;
          if (e.data && typeof e.data.text === 'string') return e.data.text;
          return '';
        })
        .join('');

      if (typeof lastEvent.data === 'string') {
        return { ...lastEvent, data: mergedText };
      }
      if (lastEvent.data && typeof lastEvent.data === 'object') {
        return { ...lastEvent, data: { ...lastEvent.data, text: mergedText } };
      }
    }

    // 其他类型：取最后一个
    return events[events.length - 1];
  }
}
