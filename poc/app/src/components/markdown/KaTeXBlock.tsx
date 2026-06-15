/**
 * KaTeXBlock — KaTeX 公式渲染组件
 *
 * 功能：在 WebView 中渲染 LaTeX 公式
 * 降级：渲染失败 → 显示 LaTeX 源码
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface KaTeXBlockProps {
  formula: string;
  displayMode?: boolean;
  onReady?: (height: number) => void;
}

// PoC 阶段用 CDN，正式版改为 asset://
const KATEX_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.11';

export function KaTeXBlock({ formula, displayMode = true, onReady }: KaTeXBlockProps) {
  const [height, setHeight] = useState(50);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="${KATEX_CDN}/dist/katex.min.css">
  <script src="${KATEX_CDN}/dist/katex.min.js"></script>
  <style>
    body { margin: 0; padding: 8px; overflow: hidden; background: transparent; }
    .katex { font-size: ${displayMode ? '1.1em' : '1em'}; }
  </style>
</head>
<body>
  <div id="math"></div>
  <script>
    try {
      katex.render(${JSON.stringify(formula)}, document.getElementById('math'), {
        displayMode: ${displayMode},
        throwOnError: false
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'katex:ready',
        height: document.body.scrollHeight
      }));
    } catch (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'katex:error',
        error: e.message
      }));
    }
  </script>
</body>
</html>`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'katex:ready' && data.height) {
        const newHeight = Math.max(data.height, 30);
        setHeight(newHeight);
        setState('ready');
        onReady?.(newHeight);
      } else if (data.type === 'katex:error') {
        setState('error');
      }
    } catch {
      // 忽略解析错误
    }
  };

  // 降级：显示 LaTeX 源码
  if (state === 'error') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{formula}</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={[styles.webView, { height }]}
      onMessage={handleMessage}
      scrollEnabled={false}
      scalesPageToFit={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    backgroundColor: 'transparent',
  },
  fallback: {
    padding: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  fallbackText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#92400e',
  },
});
