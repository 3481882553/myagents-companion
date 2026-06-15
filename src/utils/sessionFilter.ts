/**
 * 会话过滤工具
 * v0.2 架构升级 — 基于 agentDir 精确匹配
 */

import type { Session } from '../types/session';

// 需要过滤的会话类型
const FILTERED_PATTERNS = [
  // 小助理会话
  {
    check: (s: Session) => {
      if (!s.agentDir) return false;
      const normalized = s.agentDir.replace(/\\/g, '/');
      return normalized.endsWith('/.myagents');
    },
    reason: '小助理会话',
  },
  // Cron 会话
  {
    check: (s: Session) => !!s.cronTaskId,
    reason: '定时任务会话',
  },
  // 内部会话
  {
    check: (s: Session) => !!s.isInternal,
    reason: '内部会话',
  },
];

/**
 * 过滤用户会话，移除内部/Cron/小助理会话
 */
export function filterUserSessions(sessions: Session[]): Session[] {
  return sessions.filter((session) => {
    for (const pattern of FILTERED_PATTERNS) {
      if (pattern.check(session)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 获取被过滤的会话及原因（调试用）
 */
export function getFilteredSessions(sessions: Session[]): Array<{ session: Session; reason: string }> {
  const filtered: Array<{ session: Session; reason: string }> = [];

  for (const session of sessions) {
    for (const pattern of FILTERED_PATTERNS) {
      if (pattern.check(session)) {
        filtered.push({ session, reason: pattern.reason });
        break;
      }
    }
  }

  return filtered;
}
