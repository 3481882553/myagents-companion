/**
 * 消息类型定义
 * v0.2 架构升级 — 统一数据层
 */

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawContent?: any;
  toolCalls?: ToolCall[];
  thinking?: string;
  createdAt: number;
  status: 'sending' | 'sent' | 'error';
}

export interface ToolCall {
  id: string;
  name: string;
  input: string;
  output?: string;
  status: 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
}

export interface MessageChunk {
  messageId: string;
  text: string;
  timestamp: number;
}
