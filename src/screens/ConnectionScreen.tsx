/**
 * 连接页
 * v0.2 架构升级 — React Navigation
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useConnectionStore } from '../store/connectionStore';
import { ApiService } from '../services/ApiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Connection'>;

export function ConnectionScreen({ navigation }: Props) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('32101');
  const [pairCode, setPairCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const { setConnection, setToken } = useConnectionStore();

  const handleConnect = async () => {
    if (!host.trim()) {
      Alert.alert('错误', '请输入桌面端 IP 地址');
      return;
    }

    setStatus('connecting');
    try {
      const api = new ApiService({ host: host.trim(), port: parseInt(port) });
      const res = await fetch(`http://${host.trim()}:${port}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pairCode }),
      });
      const data = await res.json();
      if (data.token) {
        setConnection(`${host.trim()}:${port}`);
        setToken(data.token);
        setStatus('connected');
        navigation.goBack();
      } else {
        setStatus('error');
        Alert.alert('配对失败', data.error || '请检查配对码');
      }
    } catch (err) {
      setStatus('error');
      Alert.alert('连接失败', '无法连接到桌面端');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>IP 地址</Text>
        <TextInput
          style={styles.input}
          value={host}
          onChangeText={setHost}
          placeholder="192.168.1.5"
          placeholderTextColor="#968a7e"
        />

        <Text style={styles.label}>端口</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder="32101"
          placeholderTextColor="#968a7e"
          keyboardType="numeric"
        />

        <Text style={styles.label}>配对码</Text>
        <TextInput
          style={styles.input}
          value={pairCode}
          onChangeText={setPairCode}
          placeholder="123456"
          placeholderTextColor="#968a7e"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.connectBtn, status === 'connecting' && styles.connectBtnDisabled]}
          onPress={handleConnect}
          disabled={status === 'connecting'}
        >
          <Text style={styles.connectBtnText}>
            {status === 'connecting' ? '连接中...' : '连接'}
          </Text>
        </TouchableOpacity>
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
  form: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e2825',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#faf6ee',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1c1612',
  },
  connectBtn: {
    backgroundColor: '#c26d3a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  connectBtnDisabled: {
    opacity: 0.5,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
