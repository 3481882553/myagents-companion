/**
 * 小助理页
 * v0.2 架构升级 — React Navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Helper'>;

export function HelperScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>小助理</Text>
        <Text style={styles.subtitle}>帮你诊断连接问题和配置错误</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionTitle}>诊断连接</Text>
            <Text style={styles.actionDesc}>检查网络和配对状态</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>查看日志</Text>
            <Text style={styles.actionDesc}>查看最近的错误日志</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionTitle}>检查配置</Text>
            <Text style={styles.actionDesc}>验证 Sidecar 配置</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>系统状态</Text>
            <Text style={styles.actionDesc}>查看内存和连接状态</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf6ee',
  },
  header: {
    marginBottom: 24,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1612',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6f6156',
  },
});
