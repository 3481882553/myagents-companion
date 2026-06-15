/**
 * ApiService — 统一 API 服务层
 * v0.2 架构升级 — 统一数据层
 */

import type { ConnectionConfig } from '../types/connection';
import type { Session } from '../types/session';
import type { Message, ToolCall } from '../types/message';

export class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenExpired?: () => void;

  constructor(config: ConnectionConfig) {
    this.baseUrl = `http://${config.host}:${config.port}`;
    this.token = config.token || null;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setOnTokenExpired(callback: () => void) {
    this.onTokenExpired = callback;
  }

  // ========== 会话列表 ==========

  async getSessionList(): Promise<Session[]> {
    const data = await this.get<{ sessions: any[] }>('/api/session/list');
    return data.sessions
      .filter((s: any) => !s.internal && !s.cronTaskId)
      .map((s: any) => this.normalizeSession(s));
  }

  // ========== 会话消息 ==========

  async getMessages(sessionId: string): Promise<Message[]> {
    const data = await this.get<{ messages: any[] }>(
      `/api/session/messages?sessionId=${sessionId}`
    );
    return data.messages.map((m: any) => this.normalizeMessage(m, sessionId));
  }

  // ========== 发送消息 ==========

  async sendMessage(sessionId: string, content: string): Promise<boolean> {
    try {
      await this.post('/api/session/send', { sessionId, message: content });
      return true;
    } catch {
      return false;
    }
  }

  // ========== 格式转换 ==========

  private normalizeSession(raw: any): Session {
    // 修复运算优先级 bug：先检查两者，再统一转换
    let lastMessageAt: number;
    if (raw.lastMessageAt && typeof raw.lastMessageAt === 'number') {
      lastMessageAt = raw.lastMessageAt;
    } else if (raw.lastActiveAt) {
      lastMessageAt = new Date(raw.lastActiveAt).getTime();
    } else {
      lastMessageAt = Date.now();
    }

    return {
      id: raw.id,
      title: raw.title || '未命名会话',
      lastMessageAt,
      messageCount: raw.messageCount || raw.stats?.messageCount || 0,
      isInternal: !!raw.internal,
      agentDir: raw.agentDir,
      source: raw.source,
      cronTaskId: raw.cronTaskId,
    };
  }

  private normalizeMessage(raw: any, sessionId: string): Message {
    const content = raw.content || raw.message?.content;
    const role = raw.role || (raw.type === 'user' ? 'user' : 'assistant');

    return {
      id: raw.id || raw.uuid || `msg_${Date.now()}`,
      sessionId,
      role,
      content: this.extractText(content),
      rawContent: content,
      toolCalls: this.extractToolCalls(content),
      thinking: this.extractThinking(content),
      createdAt: raw.createdAt || raw.created_at
        ? new Date(raw.created_at).getTime()
        : Date.now(),
      status: 'sent',
    };
  }

  private extractText(content: any): string {
    if (!content) return '';
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((b: any) => b.type === 'text' && b.text)
            .map((b: any) => b.text)
            .join('\n');
        }
      } catch {
        return content;
      }
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .filter((b: any) => b.type === 'text' && b.text)
        .map((b: any) => b.text)
        .join('\n');
    }
    return String(content);
  }

  private extractToolCalls(content: any): ToolCall[] {
    if (!content) return [];
    let blocks: any[] = [];

    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) blocks = parsed;
      } catch {
        return [];
      }
    } else if (Array.isArray(content)) {
      blocks = content;
    }

    return blocks
      .filter((b: any) => b.type === 'tool_use')
      .map((b: any) => ({
        id: b.id || `tool_${Date.now()}`,
        name: b.name || 'Unknown',
        input: typeof b.input === 'string' ? b.input : JSON.stringify(b.input || {}),
        status: 'completed' as const,
      }));
  }

  private extractThinking(content: any): string | undefined {
    if (!content) return undefined;
    let blocks: any[] = [];

    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) blocks = parsed;
      } catch {
        return undefined;
      }
    } else if (Array.isArray(content)) {
      blocks = content;
    }

    const thinkingBlock = blocks.find((b: any) => b.type === 'thinking');
    return thinkingBlock?.thinking;
  }

  // ========== HTTP 请求 ==========

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' })) as any;

      if (response.status === 401) {
        this.onTokenExpired?.();
        throw new Error(error.error || 'Unauthorized');
      }

      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
