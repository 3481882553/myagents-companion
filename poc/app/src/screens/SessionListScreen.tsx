/**
 * SessionListScreen — 会话列表
 *
 * 功能：显示会话列表，点击进入聊天
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useConnectionStore } from '../store/connectionStore';
import { useSessionStore } from '../store/sessionStore';
import { ApiService } from '../services/ApiService';

const TAG = '[SessionListScreen]';
type Props = NativeStackScreenProps<RootStackParamList, 'SessionList'>;

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 172800000) return '昨天';
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

export function SessionListScreen({ navigation }: Props) {
  const { host: storeHost, token: storeToken } = useConnectionStore();
  const { sessions, setSessions, loading, setLoading, error, setError } = useSessionStore();
  const effectiveHost = storeHost;
  const effectiveToken = storeToken;

  useEffect(() => {
    console.log(TAG, '屏幕已挂载, host:', effectiveHost || '(未设置)');
    loadSessions();
    return () => console.log(TAG, '屏幕将卸载');
  }, [effectiveHost]);

  const loadSessions = async () => {
    if (!effectiveHost) {
      console.log(TAG, '无 host, 跳过加载');
      setSessions([]);
      setLoading(false);
      return;
    }

    console.log(TAG, '开始加载会话...');
    try {
      const api = new ApiService({ host: effectiveHost, port: 32102, token: effectiveToken || '' });
      const sessionList = await api.getSessions();
      console.log(TAG, '加载成功:', sessionList.length, '个会话');
      setSessions(sessionList);
    } catch (err: any) {
      console.error(TAG, '加载失败:', err?.message || err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 会话列表（标题栏由 React Navigation 提供） */}
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
              onPress={() => {
                console.log(TAG, '选中会话:', session.id, session.title);
                navigation.navigate('Chat', { sessionId: session.id });
              }}
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
