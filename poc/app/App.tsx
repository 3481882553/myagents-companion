/**
 * MyAgents Companion PoC — App 入口
 *
 * W1-W9: PoC + 通信 + 认证 + 渲染 + Sidecar
 * W10: 深度链接 + IM 集成
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { SessionListScreen } from './src/screens/SessionListScreen';
import { ChatScreen, Message } from './src/screens/ChatScreen';
import { KaTeXDemo } from './src/components/KaTeXDemo';
import { MermaidDemo } from './src/components/MermaidDemo';
import { BashToolDemo } from './src/components/BashToolDemo';

type Screen = 'home' | 'connection' | 'sessions' | 'chat' | 'katex' | 'mermaid' | 'bash' | 'helper';

interface AppState {
  connectedHost: string | null;
  token: string | null;
  currentSessionId: string | null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [state, setState] = useState<AppState>({
    connectedHost: null,
    currentSessionId: null,
  });

  // Android 返回键处理
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'chat') {
        setScreen('sessions');
        return true;
      }
      if (screen !== 'home') {
        setScreen('home');
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [screen]);

  const handleConnected = async (host: string) => {
    try {
      // 配对获取 Token
      const res = await fetch(`http://${host}/api/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '123456' }),
      });
      const data = await res.json();
      if (data.token) {
        setState(prev => ({ ...prev, connectedHost: host, token: data.token }));
      }
    } catch {
      // 配对失败时，尝试无 Token 模式
      setState(prev => ({ ...prev, connectedHost: host }));
    }
    setScreen('sessions');
  };

  const handleSelectSession = (sessionId: string) => {
    setState(prev => ({ ...prev, currentSessionId: sessionId }));
    setScreen('chat');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'connection':
        return (
          <ConnectionScreen
            onBack={() => setScreen('home')}
            onConnected={handleConnected}
          />
        );
      case 'sessions':
        return (
          <SessionListScreen
            host={state.connectedHost || undefined}
            token={state.token}
            onSelect={handleSelectSession}
            onBack={() => setScreen('home')}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            sessionId={state.currentSessionId || 'unknown'}
            host={state.connectedHost || undefined}
            token={state.token}
            onBack={() => setScreen('sessions')}
            onSend={(msg) => console.log('Send:', msg)}
          />
        );
      case 'katex':
        return <KaTeXDemo />;
      case 'mermaid':
        return <MermaidDemo />;
      case 'bash':
        return <BashToolDemo />;
      case 'helper':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🤖 小助理（W11 实现）</Text>
          </View>
        );
      default:
        return <HomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#6f6156',
  },
});
