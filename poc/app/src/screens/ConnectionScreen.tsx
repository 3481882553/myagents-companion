/**
 * ConnectionScreen — 连接管理
 *
 * 功能：
 * - 手动输入 IP + 端口 + 配对码
 * - 连接状态显示
 * - 连接/断开操作
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface ConnectionScreenProps {
  onConnected?: (host: string) => void;
  onBack?: () => void;
}

export function ConnectionScreen({ onConnected, onBack }: ConnectionScreenProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('32101');
  const [pairCode, setPairCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!host.trim()) {
      Alert.alert('错误', '请输入桌面端 IP 地址');
      return;
    }

    setStatus('connecting');
    setError('');

    try {
      const fullHost = `${host.trim()}:${port}`;

      // 健康检查（带超时）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`http://${fullHost}/health/live`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          setStatus('connected');
          onConnected?.(fullHost);
        } else {
          throw new Error('连接失败');
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('连接超时');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || '连接失败');
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>连接桌面端</Text>
      </View>

      {/* 连接状态 */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: status === 'connected' ? '#22c55e' : '#dc2626' }
          ]} />
          <Text style={styles.statusText}>
            {status === 'connected' ? '已连接' :
             status === 'connecting' ? '连接中...' :
             status === 'error' ? '连接失败' : '未连接'}
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* 输入表单 */}
      <View style={styles.form}>
        <Text style={styles.label}>桌面端 IP 地址</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.5"
          placeholderTextColor="#968a7e"
          value={host}
          onChangeText={setHost}
          keyboardType="numeric"
        />

        <Text style={styles.label}>端口</Text>
        <TextInput
          style={styles.input}
          placeholder="32101"
          placeholderTextColor="#968a7e"
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
        />

        <Text style={styles.label}>配对码（可选）</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor="#968a7e"
          value={pairCode}
          onChangeText={setPairCode}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      {/* 连接按钮 */}
      <TouchableOpacity
        style={[styles.connectBtn, status === 'connecting' && styles.connectBtnDisabled]}
        onPress={handleConnect}
        disabled={status === 'connecting'}
      >
        <Text style={styles.connectBtnText}>
          {status === 'connecting' ? '连接中...' : '连接'}
        </Text>
      </TouchableOpacity>

      {/* 扫码连接（预留） */}
      <View style={styles.scanPlaceholder}>
        <Text style={styles.scanPlaceholderText}>📷 扫码连接（W10 实现）</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 8,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#6f6156',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1c1612',
  },
  connectBtn: {
    backgroundColor: '#c26d3a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  connectBtnDisabled: {
    opacity: 0.6,
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanBtn: {
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  scanPlaceholder: {
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  scanPlaceholderText: {
    fontSize: 14,
    color: '#968a7e',
  },
});
