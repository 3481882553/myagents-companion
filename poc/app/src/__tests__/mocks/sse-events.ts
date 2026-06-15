/**
 * SSE 事件 fixtures — 用于 SSE 客户端和集成测试
 *
 * 事件分类严格对照 src/server/sse.ts 的 SSE_EVENT_PRIORITIES
 */

export interface SSEEvent {
  type: string;
  data: string; // SSE 原始 data 是字符串
}

/** critical 事件（41 个显式 + 2 个隐式） */
export const CRITICAL_EVENTS = {
  systemInit: { type: 'chat:system-init', data: '{"status":"ready"}' },
  systemStatus: { type: 'chat:system-status', data: '{"status":"compacting"}' },
  status: { type: 'chat:status', data: '{"status":"running"}' },
  init: { type: 'chat:init', data: '{"sessionId":"ses-abc123"}' },
  apiRetry: { type: 'chat:api-retry', data: '{"attempt":1,"maxRetries":3}' },
  messageComplete: { type: 'chat:message-complete', data: '{"id":"msg-1","content":"Hello World"}' },
  messageError: { type: 'chat:message-error', data: '{"error":"Rate limit exceeded"}' },
  messageStopped: { type: 'chat:message-stopped', data: '' },
  messageReplay: { type: 'chat:message-replay', data: '{"messages":[]}' },
  messageSdkUuid: { type: 'chat:message-sdk-uuid', data: '{"uuid":"uuid-123"}' },
  thinkingStart: { type: 'chat:thinking-start', data: '{}' },
  contentBlockStop: { type: 'chat:content-block-stop', data: '{}' },
  agentError: { type: 'chat:agent-error', data: '{"error":"Connection failed"}' },
  toolUseStart: { type: 'chat:tool-use-start', data: '{"toolName":"Bash","input":{"command":"ls"}}' },
  toolResultStart: { type: 'chat:tool-result-start', data: '{"toolName":"Bash"}' },
  toolResultComplete: { type: 'chat:tool-result-complete', data: '{"toolName":"Bash","result":"file1.txt"}' },
  toolAttachmentUpdate: { type: 'chat:tool-attachment-update', data: '{"attachmentId":"att-1"}' },
  serverToolUseStart: { type: 'chat:server-tool-use-start', data: '{"toolName":"webReader"}' },
  subagentToolUse: { type: 'chat:subagent-tool-use', data: '{"toolName":"Read"}' },
  subagentToolResultStart: { type: 'chat:subagent-tool-result-start', data: '{}' },
  subagentToolResultComplete: { type: 'chat:subagent-tool-result-complete', data: '{}' },
  permissionModeChanged: { type: 'chat:permission-mode-changed', data: '{"mode":"auto"}' },
  taskNotification: { type: 'chat:task-notification', data: '{"message":"Task completed"}' },
  taskStarted: { type: 'chat:task-started', data: '{"taskId":"task-1"}' },
  permissionRequest: { type: 'permission:request', data: '{"requestId":"req-1","toolName":"Bash","input":{"command":"rm -rf /"}}' },
  askUserQuestion: { type: 'ask-user-question:request', data: '{"requestId":"req-2","question":"Continue?"}' },
  askUserExpired: { type: 'ask-user-question:expired', data: '{"requestId":"req-2"}' },
  exitPlanMode: { type: 'exit-plan-mode:request', data: '{"requestId":"req-3"}' },
  exitPlanExpired: { type: 'exit-plan-mode:expired', data: '{"requestId":"req-3"}' },
  enterPlanMode: { type: 'enter-plan-mode:request', data: '{}' },
  enterPlanExpired: { type: 'enter-plan-mode:expired', data: '{}' },
  cronTaskExit: { type: 'cron:task-exit-requested', data: '{"taskId":"cron-1"}' },
  mcpOauthExpired: { type: 'mcp:oauth-expired', data: '{"serverId":"playwright"}' },
  configChanged: { type: 'config:changed', data: '{}' },
  pluginInstallProgress: { type: 'plugin:install-progress', data: '{"phase":"installing"}' },
  pluginsChanged: { type: 'plugins:changed', data: '{}' },
  queueAdded: { type: 'queue:added', data: '{"queueId":"q-1","isInFlight":false}' },
  queueStarted: { type: 'queue:started', data: '{"queueId":"q-1"}' },
  queueCancelled: { type: 'queue:cancelled', data: '{"queueId":"q-1"}' },
  // 隐式 critical（JSON_EVENTS 中但未在 SSE_EVENT_PRIORITIES 注册）
  sessionTitleChanged: { type: 'chat:session-title-changed', data: '{"sessionId":"ses-1","title":"New Title"}' },
  subagentToolAttachmentUpdate: { type: 'chat:subagent-tool-attachment-update', data: '{"attachmentId":"att-2"}' },
} as const;

/** coalescible 事件（7 个） */
export const COALESCIBLE_EVENTS = {
  messageChunk: { type: 'chat:message-chunk', data: 'Hello' },
  thinkingChunk: { type: 'chat:thinking-chunk', data: 'Let me think...' },
  toolInputDelta: { type: 'chat:tool-input-delta', data: '{"delta":"ls"}' },
  toolResultDelta: { type: 'chat:tool-result-delta', data: '{"delta":"file1.txt\\n"}' },
  subagentToolInputDelta: { type: 'chat:subagent-tool-input-delta', data: '{"delta":"read"}' },
  subagentToolResultDelta: { type: 'chat:subagent-tool-result-delta', data: '{"delta":"content"}' },
  contextUsage: { type: 'chat:context-usage', data: '{"used":5000,"total":200000}' },
} as const;

/** droppable 事件（4 个） */
export const DROPPABLE_EVENTS = {
  log: { type: 'chat:log', data: 'Debug message' },
  logs: { type: 'chat:logs', data: '[{"level":"info","message":"test"}]' },
  debugMessage: { type: 'chat:debug-message', data: 'Debug info' },
  runtimeDiagnostics: { type: 'chat:runtime-diagnostics', data: '{"runtime":"builtin"}' },
} as const;

/** 完整的 SSE 事件流 fixture（模拟一次 AI 回复） */
export const FULL_REPLY_FLOW: SSEEvent[] = [
  CRITICAL_EVENTS.systemInit,
  CRITICAL_EVENTS.status,
  CRITICAL_EVENTS.thinkingStart,
  COALESCIBLE_EVENTS.thinkingChunk,
  COALESCIBLE_EVENTS.thinkingChunk,
  CRITICAL_EVENTS.contentBlockStop,
  CRITICAL_EVENTS.toolUseStart,
  COALESCIBLE_EVENTS.toolInputDelta,
  CRITICAL_EVENTS.toolResultStart,
  COALESCIBLE_EVENTS.toolResultDelta,
  COALESCIBLE_EVENTS.toolResultDelta,
  CRITICAL_EVENTS.toolResultComplete,
  CRITICAL_EVENTS.contentBlockStop,
  COALESCIBLE_EVENTS.messageChunk,
  COALESCIBLE_EVENTS.messageChunk,
  COALESCIBLE_EVENTS.messageChunk,
  CRITICAL_EVENTS.messageComplete,
  CRITICAL_EVENTS.status,
];

/** 所有事件类型的集合（用于遍历测试） */
export const ALL_EVENTS = {
  ...CRITICAL_EVENTS,
  ...COALESCIBLE_EVENTS,
  ...DROPPABLE_EVENTS,
};
