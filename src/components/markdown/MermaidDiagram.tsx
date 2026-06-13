/**
 * MermaidDiagram — Mermaid 图表渲染组件
 *
 * 功能：在 WebView 中渲染 Mermaid 图表
 * 降级：节点 > 100 / 渲染 > 2s / 失败 → 代码文本
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface MermaidDiagramProps {
  code: string;
  theme?: 'light' | 'dark';
}

// PoC 阶段用 CDN，正式版改为 asset://
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1';

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
  <\/script>
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

  // 降级：显示代码文本
  if (state === 'fallback' || state === 'error') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>
          {state === 'fallback' ? '⚠️ 图表过大，已降级' : '❌ 渲染失败'}
        </Text>
        <Text style={styles.fallbackCode}>{code}</Text>
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
      {renderTime !== null && (
        <Text style={styles.renderInfo}>渲染时间：{renderTime}ms</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  fallbackTitle: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 8,
  },
  fallbackCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6f6156',
  },
});
