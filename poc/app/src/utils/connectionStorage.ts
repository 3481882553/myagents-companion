/**
 * 连接历史存储
 * PoC 阶段用内存存储（重启 App 会丢失）
 * 正式版替换为 AsyncStorage / MMKV
 */

export interface ConnectionHistoryItem {
  host: string;
  pairCode: string;
  lastUsed: number;
}

// 内存存储
let historyStore: ConnectionHistoryItem[] = [];

export async function saveConnectionHistory(host: string, pairCode: string = '123456'): Promise<void> {
  // 去重
  historyStore = historyStore.filter(h => h.host !== host);
  historyStore.unshift({ host, pairCode, lastUsed: Date.now() });
  historyStore = historyStore.slice(0, 5);
}

export async function getConnectionHistory(): Promise<ConnectionHistoryItem[]> {
  return historyStore;
}
