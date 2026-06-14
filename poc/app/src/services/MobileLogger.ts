/**
 * MobileLogger — 手机端日志收集服务
 *
 * 职责：
 * - 拦截 console.log/warn/error
 * - 捕获未捕获异常
 * - 内存存储最近 100 条日志
 * - 上传到 Sidecar 存储
 */

export interface MobileLog {
  id: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  tag: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface DeviceInfo {
  os: string;
  appVersion: string;
  buildMode: string;
  freeMemory: number;
}

// 内存存储最近 100 条日志
const MAX_MEMORY_LOGS = 100;
const memoryLogs: MobileLog[] = [];
let logIdCounter = 0;
let isInitialized = false;
let host: string | null = null;
let token: string | null = null;

/**
 * 初始化日志服务
 */
export function initLogger(connectionHost: string, connectionToken: string | null) {
  if (isInitialized) return;
  isInitialized = true;
  host = connectionHost;
  token = connectionToken;

  // 拦截 console
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    addLog('log', 'Console', formatArgs(args));
    originalLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    addLog('warn', 'Console', formatArgs(args));
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    addLog('error', 'Console', formatArgs(args));
    originalError.apply(console, args);
  };

  // 捕获未捕获异常
  const globalObj = globalThis as any;
  if (globalObj.ErrorUtils) {
    const originalHandler = globalObj.ErrorUtils.globalHandler;
    globalObj.ErrorUtils.globalHandler = (error: Error, isFatal?: boolean) => {
      addLog('error', 'Crash', error.message, error.stack);
      if (originalHandler) originalHandler(error, isFatal);
    };
  }

  addLog('info', 'Logger', '日志服务已初始化');
}

/**
 * 添加日志
 */
export function addLog(
  level: MobileLog['level'],
  tag: string,
  message: string,
  stack?: string,
  context?: Record<string, any>
) {
  const log: MobileLog = {
    id: `log_${++logIdCounter}_${Date.now()}`,
    timestamp: Date.now(),
    level,
    tag,
    message: typeof message === 'string' ? message : JSON.stringify(message),
    stack,
    context,
  };

  memoryLogs.push(log);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.shift();
  }
}

/**
 * 获取内存中的日志
 */
export function getLogs(options?: {
  level?: MobileLog['level'];
  tag?: string;
  keyword?: string;
  limit?: number;
}): MobileLog[] {
  let logs = [...memoryLogs];

  if (options?.level) {
    logs = logs.filter(l => l.level === options.level);
  }
  if (options?.tag) {
    logs = logs.filter(l => l.tag === options.tag);
  }
  if (options?.keyword) {
    const kw = options.keyword.toLowerCase();
    logs = logs.filter(l =>
      l.message.toLowerCase().includes(kw) ||
      l.tag.toLowerCase().includes(kw)
    );
  }
  if (options?.limit) {
    logs = logs.slice(-options.limit);
  }

  return logs;
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  const RN = require('react-native');
  return {
    os: `Android ${RN.Platform.Version}`,
    appVersion: '0.1.0',
    buildMode: __DEV__ ? 'debug' : 'release',
    freeMemory: 0, // RN 没有直接 API，后续可通过 Native 模块获取
  };
}

/**
 * 上传日志到 Sidecar
 */
export async function uploadLogs(logs?: MobileLog[]): Promise<boolean> {
  if (!host || !token) return false;

  const logsToUpload = logs || memoryLogs.slice(-50);
  if (logsToUpload.length === 0) return true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`http://${host}/api/mobile/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        logs: logsToUpload,
        deviceInfo: getDeviceInfo(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * 格式化参数为字符串
 */
function formatArgs(args: any[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

/**
 * 记录 API 请求日志
 */
export function logApiRequest(method: string, url: string, duration: number, status?: number) {
  const level = status && status >= 400 ? 'warn' : 'log';
  addLog(level, 'API', `${method} ${url} ${duration}ms ${status || ''}`);
}

/**
 * 记录页面导航日志
 */
export function logNavigation(from: string, to: string) {
  addLog('info', 'Nav', `${from} → ${to}`);
}
