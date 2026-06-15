/**
 * 会话列表页
 * v0.2 架构升级 — React Navigation + Zustand
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useSessionStore } from '../store/sessionStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionList'>;

export function SessionListScreen({ navigation }: Props) {
  const { sessions, loading, loadSessions } = useSessionStore();

  useEffect(() => {
    // TODO: 从 ApiService 获取会话列表
    loadSessions([
      { id: 'ses_001', title: '代码审查助手', lastMessageAt: Date.now() - 300000, messageCount: 42, isInternal: false },
      { id: 'ses_002', title: '文档生成器', lastMessageAt: Date.now() - 3600000, messageCount: 18, isInternal: false },
      { id: 'ses_003', title: '调试助手', lastMessageAt: Date.now() - 86400000, messageCount: 156, isInternal: false },
    ]);
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return '昨天';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c26d3a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {sessions.map((session) => (
        <TouchableOpacity
          key={session.id}
          style={styles.sessionCard}
          onPress={() => navigation.navigate('Chat', { sessionId: session.id })}
        >
          <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.sessionTime}>{formatTime(session.lastMessageAt)}</Text>
          <Text style={styles.sessionCount}>{session.messageCount} 条消息</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf6ee',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf6ee',
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
});
