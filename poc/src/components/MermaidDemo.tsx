/**
 * Mermaid 渲染 PoC
 *
 * 验证项：
 * - Mermaid 在 WebView 中渲染流程图/时序图/甘特图
 * - 主题切换（light/dark）
 * - 降级策略（节点 > 100 / 渲染 > 2s）
 * - 动态高度
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1';

interface MermaidDiagramProps {
  code: string;
  theme?: 'light' | 'dark';
}

export function MermaidDiagram({ code, theme = 'light' }: MermaidDiagramProps) {
  const [height, setHeight] = useState(200);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'fallback'>('loading');
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="${MERMAID_CDN}/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 8px; background: transparent; }
    #mermaid-container { display: inline-block; min-width: 100%; }
  </style>
</head>
<body>
  <div id="mermaid-container"></div>
  <script>
    function initMermaid() {
      if (typeof mermaid === 'undefined') {
        setTimeout(initMermaid, 100);
        return;
      }
      mermaid.initialize({
        startOnLoad: false,
        theme: '${theme === 'dark' ? 'dark' : 'default'}',
        securityLevel: 'strict'
      });

      const startTime = Date.now();
      try {
        mermaid.render('mermaid-graph', ${JSON.stringify(code)}).then(result => {
          document.getElementById('mermaid-container').innerHTML = result.svg;
          const nodeCount = document.querySelectorAll('.node').length;
          const svgSize = result.svg.length;
          const elapsed = Date.now() - startTime;

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mermaid:ready',
            svg: result.svg,
            renderTime: elapsed,
            nodeCount: nodeCount,
            svgSize: svgSize,
            height: document.body.scrollHeight
          }));
        }).catch(e => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mermaid:error',
            error: e.message
          }));
        });
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mermaid:error',
          error: e.message
        }));
      }
    }
    initMermaid();
  </script>
</body>
</html>`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'mermaid:ready':
          setHeight(Math.max(data.height || 200, 100));
          setRenderTime(data.renderTime);
          // 降级检查
          if (data.nodeCount > 100 || data.svgSize > 500 * 1024 || data.renderTime > 2000) {
            setState('fallback');
          } else {
            setState('ready');
          }
          break;
        case 'mermaid:error':
          setState('error');
          break;
      }
    } catch {
      // 忽略解析错误
    }
  };

  if (state === 'fallback') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>⚠️ 图表过大，已降级为代码显示</Text>
        <Text style={styles.codeText}>{code}</Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>❌ 图表渲染失败</Text>
        <Text style={styles.codeText}>{code}</Text>
      </View>
    );
  }

  return (
    <View>
      <WebView
        source={{ html }}
        style={[styles.webView, { height }]}
        onMessage={handleMessage}
        scrollEnabled={false}
        scalesPageToFit={false}
      />
      {renderTime && (
        <Text style={styles.renderInfo}>渲染时间：{renderTime}ms</Text>
      )}
    </View>
  );
}

// 演示页面
export function MermaidDemo() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const diagrams = [
    {
      label: '流程图（Flowchart）',
      code: `flowchart TD
    A[开始] --> B{是否已配对?}
    B -->|是| C[连接 Sidecar]
    B -->|否| D[显示二维码]
    D --> E[扫码配对]
    E --> C
    C --> F{连接成功?}
    F -->|是| G[显示会话列表]
    F -->|否| H[显示错误]
    H --> C
    G --> I[用户选择会话]
    I --> J[加载消息]
    J --> K[渲染 Markdown]`,
    },
    {
      label: '时序图（Sequence Diagram）',
      code: `sequenceDiagram
    participant M as 手机 App
    participant S as Sidecar
    participant A as AI SDK
    M->>S: POST /api/session/send
    S->>A: 注入用户消息
    A-->>S: SSE chat:message-chunk
    S-->>M: SSE 流式推送
    A-->>S: SSE chat:message-complete
    S-->>M: SSE 完成事件
    M->>M: 渲染最终结果`,
    },
    {
      label: '甘特图（Gantt）',
      code: `gantt
    title MyAgents Companion 开发计划
    dateFormat  YYYY-MM-DD
    section Phase 0 PoC
    WebView 渲染 PoC     :a1, 2026-06-16, 5d
    通信层 PoC           :a2, after a1, 5d
    端到端 Spike         :a3, after a2, 5d
    section Phase 1 MVP
    RN 项目 + 通信层     :b1, after a3, 10d
    Markdown 渲染        :b2, after b1, 5d
    Sidecar 改造         :b3, after b2, 10d`,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mermaid 渲染 PoC</Text>

      <View style={styles.themeSwitch}>
        <TouchableOpacity
          style={[styles.themeBtn, theme === 'light' && styles.themeBtnActive]}
          onPress={() => setTheme('light')}
        >
          <Text style={[styles.themeBtnText, theme === 'light' && styles.themeBtnTextActive]}>亮色</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.themeBtn, theme === 'dark' && styles.themeBtnActive]}
          onPress={() => setTheme('dark')}
        >
          <Text style={[styles.themeBtnText, theme === 'dark' && styles.themeBtnTextActive]}>暗色</Text>
        </TouchableOpacity>
      </View>

      {diagrams.map((d, i) => (
        <View key={i} style={styles.diagramCard}>
          <Text style={styles.diagramLabel}>{d.label}</Text>
          <MermaidDiagram code={d.code} theme={theme} />
        </View>
      ))}

      <Text style={styles.note}>
        验证项：
        {'\n'}• 流程图/时序图/甘特图渲染正确
        {'\n'}• 主题切换即时生效
        {'\n'}• 50 节点流程图渲染 {'< 2s'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf6ee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1612',
    marginBottom: 8,
  },
  themeSwitch: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  themeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    backgroundColor: '#fffcf7',
  },
  themeBtnActive: {
    backgroundColor: '#c26d3a',
    borderColor: '#c26d3a',
  },
  themeBtnText: {
    fontSize: 14,
    color: '#1c1612',
  },
  themeBtnTextActive: {
    color: '#fff',
  },
  diagramCard: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  diagramLabel: {
    fontSize: 13,
    color: '#6f6156',
    marginBottom: 8,
  },
  webView: {
    backgroundColor: 'transparent',
  },
  renderInfo: {
    fontSize: 11,
    color: '#968a7e',
    marginTop: 4,
    textAlign: 'right',
  },
  fallback: {
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  fallbackText: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6f6156',
  },
  note: {
    fontSize: 13,
    color: '#6f6156',
    lineHeight: 20,
    marginBottom: 32,
    marginTop: 8,
  },
});
