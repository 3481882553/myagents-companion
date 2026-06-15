/**
 * HomeScreen — 首页
 *
 * 功能：
 * - 连接状态显示
 * - 快速连接入口
 * - PoC 验证入口
 * - 小助理入口（预留）
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useConnectionStore } from '../store/connectionStore';

const TAG = '[HomeScreen]';
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { status, host } = useConnectionStore();
  const isConnected = status === 'connected';

  useEffect(() => {
    console.log(TAG, '屏幕已挂载, 连接状态:', status);
    return () => console.log(TAG, '屏幕将卸载');
  }, []);

  const handleNavigate = (screen: string) => {
    console.log(TAG, '导航到:', screen);
    navigation.navigate(screen as any);
  };

  console.log(TAG, '渲染, 状态:', status);

  return (
    <ScrollView style={styles.container}>
      {/* 标题 */}
      <Text style={styles.title}>MyAgents Companion</Text>
      <Text style={styles.subtitle}>移动端 AI 助手</Text>

      {/* 连接状态卡片 */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22c55e' : '#dc2626' }]} />
          <Text style={styles.statusText}>{isConnected ? `已连接 ${host}` : '未连接'}</Text>
        </View>
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => handleNavigate('Connection')}
        >
          <Text style={styles.connectBtnText}>连接桌面端</Text>
        </TouchableOpacity>
      </View>

      {/* 快捷操作 */}
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleNavigate('Connection')}
        >
          <Text style={styles.quickActionIcon}>🔗</Text>
          <Text style={styles.quickActionText}>扫码连接</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleNavigate('SessionList')}
        >
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>会话列表</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleNavigate('Helper')}
        >
          <Text style={styles.quickActionIcon}>🤖</Text>
          <Text style={styles.quickActionText}>小助理</Text>
        </TouchableOpacity>
      </View>

      {/* PoC 验证 */}
      <Text style={styles.sectionTitle}>技术验证</Text>
      <View style={styles.pocSection}>
        <TouchableOpacity
          style={styles.pocBtn}
          onPress={() => handleNavigate('KaTeX')}
        >
          <Text style={styles.pocBtnText}>KaTeX 公式渲染</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pocBtn}
          onPress={() => handleNavigate('Mermaid')}
        >
          <Text style={styles.pocBtnText}>Mermaid 图表渲染</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pocBtn}
          onPress={() => handleNavigate('Bash')}
        >
          <Text style={styles.pocBtnText}>BashTool 终端输出</Text>
        </TouchableOpacity>
      </View>

      {/* 版本信息 */}
      <Text style={styles.version}>v0.1.0 PoC</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
    padding: 16,
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
  statusCard: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    fontSize: 15,
    color: '#1c1612',
  },
  connectBtn: {
    backgroundColor: '#c26d3a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e2825',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
    fontSize: 13,
    color: '#1c1612',
    textAlign: 'center',
  },
  pocSection: {
    gap: 8,
    marginBottom: 24,
  },
  pocBtn: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
  },
  pocBtnText: {
    fontSize: 15,
    color: '#1c1612',
  },
  version: {
    fontSize: 12,
    color: '#968a7e',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
});
