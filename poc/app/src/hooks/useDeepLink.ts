/**
 * useDeepLink — 深度链接解析和验证
 *
 * 职责：解析 myagents:// URL，验证 host 白名单
 */

export interface DeepLinkData {
  sessionId: string;
  host: string;
}

/** 解析深度链接 URL */
export function parseDeepLink(url: string): DeepLinkData | null {
  if (!url) return null;

  try {
    // myagents://s/{session_id}?h={host}
    const match = url.match(/^myagents:\/\/s\/([^?]+)\?.*h=([^&]+)/);
    if (!match) return null;

    const sessionId = match[1];
    const host = match[2];

    if (!sessionId || !host) return null;

    return { sessionId, host };
  } catch {
    return null;
  }
}

/** 验证 host 是否在已配对白名单中 */
export function validateHost(host: string, pairedHosts: string[]): boolean {
  return pairedHosts.includes(host);
}
