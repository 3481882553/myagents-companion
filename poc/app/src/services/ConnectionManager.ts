/**
 * ConnectionManager — 连接状态管理
 *
 * 职责：管理与 Sidecar 的连接、重连、状态变化通知
 */

import { SidecarHttpApi } from './sidecar-api';
import { AuthService } from './auth';
import { logInfo, logError, logWarn } from '../utils/log';

const TAG = 'ConnectionManager';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RETRYING = 'retrying',
}

export interface ConnectionManagerOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  onStateChange?: (state: ConnectionState) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export class ConnectionManager {
  private _state: ConnectionState = ConnectionState.DISCONNECTED;
  private _retryDelay: number;
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private api: SidecarHttpApi;
  private auth: AuthService;

  constructor(private options: ConnectionManagerOptions = {}) {
    this._retryDelay = options.initialRetryDelay || 500;
    this.api = new SidecarHttpApi('');
    this.auth = new AuthService(this.api);
  }

  get state() {
    return this._state;
  }

  get retryDelay() {
    return this._retryDelay;
  }

  /** 开始连接 */
  async connect(host: string): Promise<void> {
    if (this._state === ConnectionState.CONNECTED || this._state === ConnectionState.CONNECTING) {
      return;
    }

    this._state = ConnectionState.CONNECTING;
    this.options.onStateChange?.(this._state);
    logInfo(TAG, `connect: ${host}`);

    // 更新 API base URL
    (this.api as any).baseUrl = `http://${host}`;

    // 尝试读取存储的 Token
    const storedToken = await this.auth.getStoredToken();
    if (storedToken) {
      this.api.setToken(storedToken);
      logDebug(TAG, '使用已存储的 Token');
    }

    // 健康检查
    const start = Date.now();
    try {
      await this.api.get('/health/live');
      const duration = Date.now() - start;
      logInfo(TAG, `health: OK ${duration}ms`);
      this._state = ConnectionState.CONNECTED;
      this.retryCount = 0;
      this._retryDelay = this.options.initialRetryDelay || 500;
      this.options.onStateChange?.(this._state);
      this.options.onConnected?.();
    } catch (err: any) {
      const duration = Date.now() - start;
      const errType = err?.name || 'Unknown';
      const errMsg = err?.message || String(err);
      logError(TAG, `health: FAILED ${duration}ms ${errType}: ${errMsg}`);
      this._state = ConnectionState.RETRYING;
      this.options.onStateChange?.(this._state);
      this.scheduleReconnect();
    }
  }

  /** 断开连接 */
  disconnect(): void {
    logInfo(TAG, `disconnect (state: ${this._state})`);
    this._state = ConnectionState.DISCONNECTED;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.api.clearToken();
    this.options.onStateChange?.(this._state);
    this.options.onDisconnected?.();
  }

  /** 安排重连 */
  private scheduleReconnect(): void {
    const maxRetries = this.options.maxRetries ?? 10;

    if (maxRetries === 0) {
      this._state = ConnectionState.DISCONNECTED;
      this.options.onStateChange?.(this._state);
      return;
    }

    this.retryCount++;

    if (this.retryCount > maxRetries) {
      logWarn(TAG, `reconnect: 超过最大重试次数 ${maxRetries}`);
      this._state = ConnectionState.DISCONNECTED;
      this.options.onStateChange?.(this._state);
      return;
    }

    // 指数退避
    this._retryDelay = Math.min(
      this._retryDelay * 2,
      this.options.maxRetryDelay || 30000
    );

    logInfo(TAG, `reconnect: 第 ${this.retryCount}/${maxRetries} 次，${this._retryDelay}ms 后重试`);

    this.reconnectTimer = setTimeout(() => {
      this._state = ConnectionState.CONNECTING;
      this.options.onStateChange?.(this._state);
      this.attemptReconnect();
    }, this._retryDelay);
  }

  /** 尝试重连 */
  private async attemptReconnect(): Promise<void> {
    try {
      await this.api.get('/health/live');
      logInfo(TAG, `reconnect: 成功`);
      this._state = ConnectionState.CONNECTED;
      this.retryCount = 0;
      this._retryDelay = this.options.initialRetryDelay || 500;
      this.options.onStateChange?.(this._state);
      this.options.onConnected?.();
    } catch (err: any) {
      logWarn(TAG, `reconnect: 失败 ${err?.message || err}`);
      this._state = ConnectionState.RETRYING;
      this.options.onStateChange?.(this._state);
      this.scheduleReconnect();
    }
  }

  /** 获取 API 实例（供其他模块使用） */
  getApi(): SidecarHttpApi {
    return this.api;
  }
}
