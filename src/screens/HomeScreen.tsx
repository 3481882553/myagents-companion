/**
 * 首页
 * v0.2 架构升级 — React Navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyAgents Companion</Text>
      <Text style={styles.subtitle}>移动端 AI 助手</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>连接状态</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.statusText}>未连接</Text>
          </View>
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => navigation.navigate('Connection')}
          >
            <Text style={styles.connectBtnText}>连接桌面端</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('SessionList')}
          >
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>会话列表</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Helper')}
          >
            <Text style={styles.quickActionIcon}>🤖</Text>
            <Text style={styles.quickActionText}>小助理</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf6ee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1612',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6f6156',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e2825',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1c1612',
  },
  connectBtn: {
    backgroundColor: '#c26d3a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1c1612',
  },
});
