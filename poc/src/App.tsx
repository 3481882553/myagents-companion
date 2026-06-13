/**
 * MyAgents Companion PoC — App 入口
 *
 * W1：WebView 渲染 PoC
 * W2：通信层 PoC
 * W3：端到端 Spike
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { KaTeXDemo } from './components/KaTeXDemo';
import { MermaidDemo } from './components/MermaidDemo';
import { BashToolDemo } from './components/BashToolDemo';
import { ChatDemo } from './screens/ChatDemo';

type Screen = 'home' | 'katex' | 'mermaid' | 'bash' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  const renderScreen = () => {
    switch (screen) {
      case 'katex':
        return <KaTeXDemo />;
      case 'mermaid':
        return <MermaidDemo />;
      case 'bash':
        return <BashToolDemo />;
      case 'chat':
        return <ChatDemo />;
      default:
        return <HomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {screen !== 'home' && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('home')}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
      )}
      {renderScreen()}
    </SafeAreaView>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <View style={styles.home}>
      <Text style={styles.title}>MyAgents Companion PoC</Text>
      <Text style={styles.subtitle}>Phase 0 — 技术验证</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>W1：渲染 PoC</Text>
        <DemoButton label="KaTeX 公式渲染" onPress={() => onNavigate('katex')} />
        <DemoButton label="Mermaid 图表渲染" onPress={() => onNavigate('mermaid')} />
        <DemoButton label="BashTool 终端输出" onPress={() => onNavigate('bash')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>W3：端到端 Spike</Text>
        <DemoButton label="聊天界面（完整流程）" onPress={() => onNavigate('chat')} />
      </View>
    </View>
  );
}

function DemoButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.demoBtn} onPress={onPress}>
      <Text style={styles.demoBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
  },
  home: {
    flex: 1,
    padding: 24,
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
    marginBottom: 32,
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
  demoBtn: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  demoBtnText: {
    fontSize: 15,
    color: '#1c1612',
  },
  backBtn: {
    padding: 12,
    paddingLeft: 16,
  },
  backText: {
    fontSize: 15,
    color: '#c26d3a',
  },
});
