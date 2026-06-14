/**
 * SessionListScreen — 会话列表
 *
 * 功能：显示会话列表，点击进入聊天
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

interface Session {
  id: string;
  title: string;
  lastMessageAt: number;
  messageCount?: number;
}

interface SessionListScreenProps {
  host?: string;
  token?: string | null;
  onSelect?: (sessionId: string) => void;
  onBack?: () => void;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 172800000) return '昨天';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export function SessionListScreen({ host, token, onSelect, onBack }: SessionListScreenProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, [host]);

  const loadSessions = async () => {
    if (!host) {
      // PoC 阶段返回模拟数据
      setSessions([
        { id: 'ses_001', title: '代码审查助手', lastMessageAt: Date.now() - 300000, messageCount: 42 },
        { id: 'ses_002', title: '文档生成器', lastMessageAt: Date.now() - 3600000, messageCount: 18 },
        { id: 'ses_003', title: '调试助手', lastMessageAt: Date.now() - 86400000, messageCount: 156 },
        { id: 'ses_004', title: '小助理', lastMessageAt: Date.now() - 60000, messageCount: 8 },
      ]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://${host}/api/session/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      // 按最后消息时间倒序排列（最新的在上面）
      const sorted = (data.sessions || []).sort((a: Session, b: Session) => b.lastMessageAt - a.lastMessageAt);
      setSessions(sorted);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>会话列表</Text>
      </View>

      {/* 会话列表 */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#c26d3a" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>暂无会话</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} maintainVisibleContentPosition={{ minIndexForVisible: 0 }}>
          {sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => onSelect?.(session.id)}
            >
              <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
              <Text style={styles.sessionTime}>{formatTime(session.lastMessageAt)}</Text>
              {session.messageCount !== undefined && (
                <Text style={styles.sessionCount}>{session.messageCount} 条消息</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 22, 18, 0.10)',
  },
  backBtn: {
    fontSize: 15,
    color: '#c26d3a',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1612',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1612',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#968a7e',
  },
  sessionCount: {
    fontSize: 12,
    color: '#6f6156',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#968a7e',
  },
  errorText: {
    fontSize: 15,
    color: '#dc2626',
  },
});
