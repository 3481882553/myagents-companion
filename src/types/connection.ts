/**
 * 连接类型定义
 * v0.2 架构升级 — 统一数据层
 */

export interface ConnectionConfig {
  host: string;
  port: number;
  token?: string;
  pairedAt?: number;
  lastConnectedAt?: number;
  deviceName?: string;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  config: ConnectionConfig | null;
  error: string | null;
  retryCount: number;
}

export interface PairResult {
  token: string;
  expiresIn: number;
}
