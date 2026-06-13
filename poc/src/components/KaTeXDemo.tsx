/**
 * KaTeX 渲染 PoC
 *
 * 验证项：
 * - KaTeX 在 WebView 中渲染 LaTeX 公式
 * - 动态高度（postMessage 传递 scrollHeight）
 * - 行内公式 + 块级公式
 * - asset:// 协议加载本地 JS/CSS
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// KaTeX HTML 模板 — 使用 asset:// 协议加载本地资源
// PoC 阶段先用 CDN，正式版改为 asset://
const KATEX_CDN = 'https://cdn.jsdelivr.net/npm/katex@0.16.11';

interface KaTeXBlockProps {
  formula: string;
  displayMode?: boolean;
}

export function KaTeXBlock({ formula, displayMode = true }: KaTeXBlockProps) {
  const [height, setHeight] = useState(50); // 默认高度
  const webViewRef = useRef<WebView>(null);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="${KATEX_CDN}/dist/katex.min.css">
  <script src="${KATEX_CDN}/dist/katex.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 8px;
      overflow: hidden;
      background: transparent;
    }
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
      // 通知 RN 渲染完成，传递高度
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
        setHeight(Math.max(data.height, 30));
      }
    } catch {
      // 忽略解析错误
    }
  };

  return (
    <WebView
      ref={webViewRef}
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

// 演示页面
export function KaTeXDemo() {
  const formulas = [
    { label: '行内公式：质能方程', formula: 'E = mc^2', displayMode: false },
    { label: '块级公式：求和', formula: '\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n', displayMode: true },
    { label: '块级公式：积分', formula: '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', displayMode: true },
    { label: '块级公式：矩阵', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', displayMode: true },
    { label: '行内公式：二次方程', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', displayMode: false },
    { label: '块级公式：极限', formula: '\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e', displayMode: true },
  ];

  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTime = useRef(Date.now());

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>KaTeX 渲染 PoC</Text>
      <Text style={styles.info}>
        公式数量：{formulas.length} | 渲染时间：{renderTime ? `${renderTime}ms` : '测量中...'}
      </Text>

      {formulas.map((f, i) => (
        <View key={i} style={styles.formulaCard}>
          <Text style={styles.formulaLabel}>{f.label}</Text>
          <KaTeXBlock
            formula={f.formula}
            displayMode={f.displayMode}
          />
        </View>
      ))}

      <Text style={styles.note}>
        {'\n'}验证项：
        {'\n'}• 公式渲染正确，无排版错误
        {'\n'}• 动态高度适配正常
        {'\n'}• {formulas.length} 个公式总渲染时间 {'< 3s'}
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
  info: {
    fontSize: 13,
    color: '#6f6156',
    marginBottom: 16,
  },
  formulaCard: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  formulaLabel: {
    fontSize: 13,
    color: '#6f6156',
    marginBottom: 8,
  },
  webView: {
    backgroundColor: 'transparent',
  },
  note: {
    fontSize: 13,
    color: '#6f6156',
    lineHeight: 20,
    marginBottom: 32,
  },
});
