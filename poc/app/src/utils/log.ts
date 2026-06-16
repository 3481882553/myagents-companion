/**
 * log — 统一日志工具
 *
 * 所有模块的日志通过此函数输出，格式统一为：
 *   [Module] message
 *
 * 使用方式：
 *   import { logInfo, logError } from '../utils/log';
 *   logInfo('ApiService', 'GET /api/session/list 120ms 200');
 *   logError('ConnectionManager', '连接失败', { host, error });
 *
 * @module utils/log
 */

// 日志等级
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 当前最低日志级别
const MIN_LEVEL: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentMinLevel = __DEV__ ? 0 : 1; // Release 下不输出 debug

function emit(level: LogLevel, module: string, msg: string, data?: any) {
  if (MIN_LEVEL[level] < currentMinLevel) return;

  const tag = `[${module}]`;
  const args = data !== undefined ? [tag, msg, data] : [tag, msg];

  switch (level) {
    case 'debug':
      console.log(...args);
      break;
    case 'info':
      console.log(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

/** 调试级 — 仅 __DEV__ 输出，函数入口/中间状态 */
export function logDebug(module: string, msg: string, data?: any) {
  emit('debug', module, msg, data);
}

/** 信息级 — 始终输出，生命周期事件（连接/发送/接收） */
export function logInfo(module: string, msg: string, data?: any) {
  emit('info', module, msg, data);
}

/** 警告级 — 始终输出，可恢复的错误（重试/Token 即将过期） */
export function logWarn(module: string, msg: string, data?: any) {
  emit('warn', module, msg, data);
}

/** 错误级 — 始终输出，不可恢复的错误（连接失败/API 错误） */
export function logError(module: string, msg: string, data?: any) {
  emit('error', module, msg, data);
}
