/**
 * StreamingMessageRenderer — 前缀固化流式渲染组件
 *
 * v0.3 W1 D3：参考 OpenOmniBot StreamingText 的 prefix-freeze 策略。
 *
 * 核心机制：
 * 1. isStreaming=false → 全部文本用 Markdown 渲染（静态模式）
 * 2. isStreaming=true → 前缀用稳定 Markdown 渲染，尾部用纯文本 + 淡入
 * 3. 定期 flush（500ms）：重新计算安全边界，固化更多前缀
 * 4. 流式完成时自动全量用 Markdown 渲染
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MarkdownRenderer } from './MarkdownRenderer';
import { lastSafeBoundary } from '../../services/streaming-utils';

const FLUSH_INTERVAL_MS = 500;

interface Props {
  text: string;
  isStreaming: boolean;
  /** 最大尾部显示长度（超出截断） */
  maxTailLength?: number;
}

export function StreamingMessageRenderer({ text, isStreaming, maxTailLength = 2000 }: Props) {
  // 已固化的前缀长度
  const [renderedPrefixLength, setRenderedPrefixLength] = useState(() =>
    isStreaming ? lastSafeBoundary(text) : text.length,
  );

  // 淡入动画
  const fadeAnim = useRef(new Animated.Value(0.6)).current;

  // 存储最近一次 isStreaming 状态，用于检测流式完成
  const wasStreaming = useRef(isStreaming);

  // 初始计算安全边界
  const boundary = useMemo(() => {
    if (!isStreaming) return text.length;
    return lastSafeBoundary(text);
  }, [text, isStreaming]);

  // 流式结束时，全量固化为 Markdown
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      // 流式 → 完成：全部文本固化
      setRenderedPrefixLength(text.length);
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, text]);

  // 定期 flush：推进前缀边界
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const newBoundary = lastSafeBoundary(text);
      setRenderedPrefixLength(prev => {
        // 只前进不后退
        if (newBoundary > prev) return newBoundary;
        return prev;
      });
    }, FLUSH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isStreaming, text]);

  // text 变化时，如果前缀长度还没到最新边界，推进
  useEffect(() => {
    if (!isStreaming) return;
    if (boundary > renderedPrefixLength) {
      setRenderedPrefixLength(boundary);
    }
  }, [boundary, isStreaming, renderedPrefixLength]);

  // 淡入动画
  useEffect(() => {
    if (isStreaming) {
      fadeAnim.setValue(0.4);
      Animated.timing(fadeAnim, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isStreaming, text, fadeAnim]);

  // 切分
  const stablePrefix = text.slice(0, renderedPrefixLength);
  const streamingTail = text.slice(renderedPrefixLength);

  // 限制尾部最大长度（避免渲染海量未格式化文本）
  const displayTail = streamingTail.length > maxTailLength
    ? streamingTail.slice(-maxTailLength)
    : streamingTail;

  // 静态模式或尾部为空：全量 Markdown
  if (!isStreaming || !displayTail) {
    return <MarkdownRenderer content={text} />;
  }

  return (
    <View style={styles.container}>
      {/* 前缀：稳定 Markdown 渲染 */}
      {stablePrefix.length > 0 && (
        <MarkdownRenderer content={stablePrefix} />
      )}
      {/* 尾部：纯文本 + 淡入动画 */}
      {displayTail.length > 0 && (
        <Animated.View testID="streaming-tail" style={{ opacity: fadeAnim }}>
          <Text style={styles.tail}>{displayTail}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 无额外容器样式
  },
  tail: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6f6156', // ink-muted
  },
});
