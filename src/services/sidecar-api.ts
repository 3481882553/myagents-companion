/**
 * SidecarHttpApi — HTTP API 客户端
 *
 * 职责：与桌面端 Sidecar 通信
 * 接口：ISidecarApi（参考详细设计 §9.1）
 */

export interface ISidecarApi {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: any): Promise<T>;
  sendMessage(sessionId: string, content: string): Promise<void>;
}

export class SidecarHttpApi implements ISidecarApi {
  private token: string | null = null;
  private onTokenExpired?: () => void;

  constructor(private baseUrl: string) {}

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setOnTokenExpired(callback: () => void) {
    this.onTokenExpired = callback;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async sendMessage(sessionId: string, content: string): Promise<void> {
    await this.post('/api/session/send', { sessionId, message: content });
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
