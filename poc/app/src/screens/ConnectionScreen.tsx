/**
 * ConnectionScreen — 连接管理
 *
 * 功能：
 * - 手动输入 IP + 端口 + 配对码
 * - 连接状态显示
 * - 连接/断开操作
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useConnectionStore } from '../store/connectionStore';
import { getConnectionHistory, saveConnectionHistory, ConnectionHistoryItem } from '../utils/connectionStorage';
import { StorageService } from '../services/StorageService';

const TAG = '[ConnectionScreen]';
type Props = NativeStackScreenProps<RootStackParamList, 'Connection'>;

export function ConnectionScreen({ navigation }: Props) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('32107');
  const [pairCode, setPairCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ConnectionHistoryItem[]>([]);

  const { connect, disconnect } = useConnectionStore();

  useEffect(() => {
    console.log(TAG, '屏幕已挂载');
    getConnectionHistory().then(setHistory);
    return () => console.log(TAG, '屏幕将卸载');
  }, []);

  const doConnect = async (fullHost: string, code: string) => {
    console.log(TAG, 'doConnect:', fullHost);
    setStatus('connecting');
    setError('');

    try {
      const [h, p] = fullHost.split(':');
      await connect(h, parseInt(p) || 32107, code);
      setStatus('connected');
      await saveConnectionHistory(fullHost, code);
      setHistory(await getConnectionHistory());
      const token = useConnectionStore.getState().token;
      console.log(TAG, '连接成功, token:', token ? `${token.slice(0, 4)}...` : null);

      // 持久化连接配置
      if (token) {
        StorageService.saveConnection({ host: h, port: parseInt(p) || 32107, token });
        StorageService.saveToken(token);
        console.log(TAG, '连接配置已持久化');
      }

      console.log(TAG, '跳转到会话列表');
      navigation.navigate('SessionList');
    } catch (err: any) {
      console.error(TAG, '连接失败:', err?.message || err);
      setStatus('error');
      setError(err.message || '连接失败');
    }
  };

  const handleConnect = () => {
    if (!host.trim()) {
      Alert.alert('错误', '请输入桌面端 IP 地址');
      return;
    }
    doConnect(`${host.trim()}:${port}`, pairCode || '123456');
  };

  const handleHistoryPress = (item: ConnectionHistoryItem) => {
    doConnect(item.host, item.pairCode);
  };

  return (
    <View style={styles.container}>
      {/* 标题栏由 React Navigation 提供 */}

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

      {/* 连接历史 */}
      {history.length > 0 && (
        <>
          <Text style={styles.historyTitle}>最近连接</Text>
          {history.map((item) => (
            <TouchableOpacity
              key={item.host}
              style={styles.historyItem}
              onPress={() => handleHistoryPress(item)}
            >
              <Text style={styles.historyHost}>{item.host}</Text>
              <Text style={styles.historyHint}>点击连接</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* 粘贴连接 */}
      <TouchableOpacity style={styles.scanBtn} onPress={async () => {
        try {
          const Clipboard = require('@react-native-clipboard/clipboard');
          const text = await Clipboard.default?.getString?.() || '';
          if (text) {
            // 尝试解析连接字符串：IP:PORT 或 IP:PORT:CODE
            const parts = text.trim().split(':');
            if (parts.length >= 2) {
              setHost(parts[0]);
              setPort(parts[1]);
              if (parts.length >= 3) setPairCode(parts[2]);
              Alert.alert('已粘贴', `地址: ${parts[0]}:${parts[1]}`);
            }
          }
        } catch {
          Alert.alert('提示', '请手动输入连接地址');
        }
      }}>
        <Text style={styles.scanBtnText}>📋 粘贴连接地址</Text>
      </TouchableOpacity>
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
  historyTitle: {
    fontSize: 13,
    color: '#6f6156',
    marginBottom: 8,
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  historyHost: {
    fontSize: 15,
    color: '#1c1612',
    fontWeight: '500',
  },
  historyHint: {
    fontSize: 12,
    color: '#c26d3a',
  },
});
