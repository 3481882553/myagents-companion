/**
 * MyAgents Companion PoC — App 入口
 *
 * W1：WebView 渲染 PoC
 * W2：通信层 PoC
 * W3：端到端 Spike
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { KaTeXDemo } from './src/components/KaTeXDemo';
import { MermaidDemo } from './src/components/MermaidDemo';
import { BashToolDemo } from './src/components/BashToolDemo';

type Screen = 'home' | 'connection' | 'katex' | 'mermaid' | 'bash' | 'helper';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  // Android 返回键处理
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'home') {
        setScreen('home');
        return true; // 已处理
      }
      return false; // 交给系统处理（退出 App）
    });
    return () => handler.remove();
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case 'connection':
        return <ConnectionScreen onBack={() => setScreen('home')} />;
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
  backBtn: {
    padding: 12,
    paddingLeft: 16,
  },
  backText: {
    fontSize: 15,
    color: '#c26d3a',
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
