/**
 * 会话类型定义
 * v0.2 架构升级 — 统一数据层
 */

export interface Session {
  id: string;
  title: string;
  lastMessageAt: number;
  messageCount: number;
  isInternal: boolean;
  agentDir?: string;
  source?: string;
  cronTaskId?: string;
  sdkSessionId?: string;
}

export interface SessionMetadata {
  id: string;
  title: string;
  lastActiveAt: string;
  stats?: {
    messageCount: number;
  };
  internal?: boolean;
  agentDir?: string;
  source?: string;
  cronTaskId?: string;
}
