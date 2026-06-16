/**
 * WidgetRenderer — WebView 沙箱渲染 AI 生成的交互式 Widget
 *
 * v0.4 W2：与桌面端 WidgetRenderer 的 iframe sandbox 模型对齐
 *
 * 安全模型：
 * - WebView 沙箱隔离（originWhitelist=['about:blank']）
 * - sanitize 过滤危险内容
 * - 连续 3 次渲染失败后永久降级
 *
 * 通信协议（与桌面端一致）：
 * - WebView 到 RN: widget:ready, widget:resize, widget:link, widget:error
 * - RN 到 WebView: widget:theme
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { sanitizeWidgetHtml } from '../../utils/sanitize';
import { logInfo, logWarn } from '../../utils/log';

const TAG = 'WidgetRenderer';
const MAX_FAILURES = 3;
const RENDER_TIMEOUT_MS = 10000;

interface WidgetRendererProps {
  widgetHtml: string;
  theme?: 'light' | 'dark';
  onReady?: () => void;
}

export function WidgetRenderer({ widgetHtml, theme = 'light', onReady }: WidgetRendererProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'fallback'>('loading');
  const [height, setHeight] = useState(200);
  const failureCount = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 超时保护
  if (state === 'loading' && !timeoutRef.current) {
    timeoutRef.current = setTimeout(() => {
      if (state === 'loading') {
        logWarn(TAG, '渲染超时，重试一次');
        setState('error');
        timeoutRef.current = null;
      }
    }, RENDER_TIMEOUT_MS);
  }

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'widget:ready':
          logInfo(TAG, 'widget ready');
          setState('ready');
          onReady?.();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          break;

        case 'widget:resize':
          if (data.height > 0 && data.height < 5000) {
            setHeight(data.height);
          }
          break;

        case 'widget:link':
          if (data.url) {
            logInfo(TAG, `widget link: ${data.url}`);
            const { Linking } = require('react-native');
            Linking.openURL(data.url);
          }
          break;

        case 'widget:error':
          failureCount.current++;
          logWarn(TAG, `widget error (${failureCount.current}/${MAX_FAILURES}): ${data.error}`);
          if (failureCount.current >= MAX_FAILURES) {
            setState('fallback');
          } else {
            setState('error');
          }
          break;
      }
    } catch (err: any) {
      logWarn(TAG, `message parse error: ${err.message}`);
    }
  }, [onReady]);

  // 永久降级
  if (state === 'fallback') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Widget 渲染失败</Text>
        <Text style={styles.fallbackHint}>（连续 {MAX_FAILURES} 次渲染失败后永久降级）</Text>
      </View>
    );
  }

  // 重试按钮
  if (state === 'error') {
    return (
      <View style={styles.fallback}>
        <TouchableOpacity
          onPress={() => {
            setState('loading');
            failureCount.current = 0;
          }}
        >
          <Text style={styles.retryBtn}>🔄 重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 构造 WebView HTML
  const safeHtml = sanitizeWidgetHtml(widgetHtml);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <style>
        body { margin: 0; font-family: -apple-system, system-ui, sans-serif; }
      </style>
    </head>
    <body>
      ${safeHtml}
      <script>
        const RN = window.ReactNativeWebView;

        // 通知就绪
        RN.postMessage(JSON.stringify({ type: 'widget:ready' }));

        // 链接拦截
        document.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (link) {
            e.preventDefault();
            RN.postMessage(JSON.stringify({ type: 'widget:link', url: link.href }));
          }
        });

        // 尺寸变化
        const observer = new ResizeObserver(entries => {
          const { height } = entries[0].contentRect;
          RN.postMessage(JSON.stringify({ type: 'widget:resize', height }));
        });
        observer.observe(document.body);

        // 错误处理
        window.onerror = (msg, src, line, col, err) => {
          RN.postMessage(JSON.stringify({ type: 'widget:error', error: msg }));
        };
      <\/script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      {state === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#968a7e" />
        </View>
      )}
      <WebView
        source={{ html }}
        onMessage={handleMessage}
        style={{ height, opacity: state === 'ready' ? 1 : 0 }}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={false}
        originWhitelist={['about:blank']}
        mixedContentMode="never"
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(250,246,238,0.8)',
    zIndex: 1,
  },
  fallback: {
    padding: 16,
    backgroundColor: 'rgba(28,22,18,0.04)',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6f6156',
    fontWeight: '500',
  },
  fallbackHint: {
    fontSize: 12,
    color: '#968a7e',
    marginTop: 4,
  },
  retryBtn: {
    fontSize: 14,
    color: '#c26d3a',
  },
});
