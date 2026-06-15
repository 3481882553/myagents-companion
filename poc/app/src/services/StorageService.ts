/**
 * StorageService — 本地存储服务
 * v0.2 架构升级 — 持久化层
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConnectionConfig } from '../types/connection';
import type { Message } from '../types/message';

// MMKV 延迟初始化（避免 mock 环境问题）
let mmkv: any = null;
function getMmkv() {
  if (!mmkv) {
    try {
      const { MMKV } = require('react-native-mmkv');
      mmkv = new MMKV();
    } catch {
      // Fallback to AsyncStorage if MMKV not available
      mmkv = null;
    }
  }
  return mmkv;
}

export class StorageService {
  // ========== 连接配置（MMKV） ==========

  static saveConnection(config: ConnectionConfig): void {
    const store = getMmkv();
    if (store) {
      store.set('connection', JSON.stringify(config));
    }
  }

  static getConnection(): ConnectionConfig | null {
    const store = getMmkv();
    if (store) {
      const data = store.getString('connection');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  static clearConnection(): void {
    const store = getMmkv();
    if (store) {
      store.delete('connection');
    }
  }

  // ========== 会话缓存（AsyncStorage） ==========

  static async saveSessionCache(sessionId: string, messages: Message[]): Promise<void> {
    const key = `session_${sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  }

  static async getSessionCache(sessionId: string): Promise<Message[]> {
    const key = `session_${sessionId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static async clearSessionCache(sessionId: string): Promise<void> {
    const key = `session_${sessionId}`;
    await AsyncStorage.removeItem(key);
  }

  // ========== 过期缓存清理 ==========

  static async clearExpiredCache(maxAgeDays: number = 30): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const key of keys) {
      if (key.startsWith('session_')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const messages = JSON.parse(data);
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && now - lastMessage.createdAt > maxAge) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    }
  }

  // ========== Token 存储（MMKV） ==========

  static saveToken(token: string): void {
    const store = getMmkv();
    if (store) {
      store.set('token', token);
    }
  }

  static getToken(): string | null {
    const store = getMmkv();
    if (store) {
      return store.getString('token') || null;
    }
    return null;
  }

  static clearToken(): void {
    const store = getMmkv();
    if (store) {
      store.delete('token');
    }
  }
}
