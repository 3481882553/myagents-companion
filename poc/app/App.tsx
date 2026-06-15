/**
 * MyAgents Companion PoC — App 入口
 *
 * v0.2 架构升级 — 增加全链路调试日志
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { SessionListScreen } from './src/screens/SessionListScreen';
import { ChatScreen, Message } from './src/screens/ChatScreen';
import { KaTeXDemo } from './src/components/KaTeXDemo';
import { MermaidDemo } from './src/components/MermaidDemo';
import { BashToolDemo } from './src/components/BashToolDemo';
import { HelperScreen } from './src/screens/HelperScreen';
import { initLogger, logNavigation } from './src/services/MobileLogger';
import { saveConnectionHistory } from './src/utils/connectionStorage';

const TAG = '[App]';

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
    token: null,
    currentSessionId: null,
  });

  useEffect(() => {
    console.log(TAG, 'App 已挂载');
    return () => console.log(TAG, 'App 将卸载');
  }, []);

  // Android 返回键处理
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log(TAG, '返回键, 当前页面:', screen);
      if (screen === 'chat') {
        console.log(TAG, '返回: chat -> sessions');
        setScreen('sessions');
        return true;
      }
      if (screen !== 'home') {
        console.log(TAG, '返回:', screen, '-> home');
        setScreen('home');
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [screen]);

  const handleScreenChange = (newScreen: Screen) => {
    console.log(TAG, '页面切换:', screen, '->', newScreen);
    setScreen(newScreen);
  };

  const handleConnected = async (host: string, token?: string) => {
    console.log(TAG, 'handleConnected:', { host, token: token ? `${token.slice(0, 4)}...` : null });
    setState(prev => ({ ...prev, connectedHost: host, token: token || null }));
    if (token) {
      initLogger(host, token);
    }
    console.log(TAG, '连接成功, 跳转到会话列表');
    setScreen('sessions');
  };

  const handleSelectSession = (sessionId: string) => {
    console.log(TAG, '选中会话:', sessionId);
    setState(prev => ({ ...prev, currentSessionId: sessionId }));
    setScreen('chat');
  };

  // 始终保持 SessionListScreen 挂载，避免滚动位置丢失
  const isSessionVisible = screen === 'sessions' || screen === 'chat';

  const renderScreen = () => {
    switch (screen) {
      case 'connection':
        return (
          <ConnectionScreen
            onBack={() => handleScreenChange('home')}
            onConnected={handleConnected}
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
          <HelperScreen
            host={state.connectedHost || undefined}
            token={state.token}
            onBack={() => handleScreenChange('home')}
          />
        );
      default:
        return <HomeScreen onNavigate={handleScreenChange} />;
    }
  };

  console.log(TAG, '渲染, 当前页面:', screen, '连接状态:', state.connectedHost ? '已连接' : '未连接');

  return (
    <ErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* SessionListScreen 始终挂载，切换时只是隐藏 */}
      <View style={{ flex: 1, display: isSessionVisible ? 'flex' : 'none' }}>
        <SessionListScreen
          host={state.connectedHost || undefined}
          token={state.token}
          onSelect={handleSelectSession}
          onBack={() => handleScreenChange('home')}
          visible={screen === 'sessions'}
        />
      </View>

      {/* ChatScreen 覆盖层 */}
      {screen === 'chat' && (
        <View style={{ flex: 1 }}>
          <ChatScreen
            sessionId={state.currentSessionId || 'unknown'}
            host={state.connectedHost || undefined}
            token={state.token}
            onBack={() => handleScreenChange('sessions')}
            onSend={(msg) => console.log(TAG, '发送消息:', msg.slice(0, 50))}
          />
        </View>
      )}

      {/* 其他页面 */}
      {screen !== 'sessions' && screen !== 'chat' && renderScreen()}
    </SafeAreaView>
    </ErrorBoundary>
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
