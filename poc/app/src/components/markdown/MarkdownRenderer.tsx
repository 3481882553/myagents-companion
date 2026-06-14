/**
 * MarkdownRenderer — Markdown 渲染组件
 *
 * 功能：渲染 Markdown 内容，支持 GFM 扩展
 * 依赖：react-native-markdown-display
 */

import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { lightTokens, darkTokens, ThemeTokens } from '../../theme/tokens';

interface MarkdownRendererProps {
  content: string;
  theme?: 'light' | 'dark';
}

export function MarkdownRenderer({ content, theme = 'light' }: MarkdownRendererProps) {
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  if (!content) return null;

  // 简单的 Markdown 渲染（PoC 阶段）
  // 正式版使用 react-native-markdown-display
  const renderLine = (line: string, index: number) => {
    // 标题
    if (line.startsWith('# ')) {
      return <Text key={index} style={[styles.h1, { color: tokens.ink }]}>{line.slice(2)}</Text>;
    }
    if (line.startsWith('## ')) {
      return <Text key={index} style={[styles.h2, { color: tokens.ink }]}>{line.slice(3)}</Text>;
    }
    if (line.startsWith('### ')) {
      return <Text key={index} style={[styles.h3, { color: tokens.ink }]}>{line.slice(4)}</Text>;
    }

    // 列表
    if (line.startsWith('- ')) {
      return <Text key={index} style={[styles.listItem, { color: tokens.ink }]}>• {line.slice(2)}</Text>;
    }

    // 引用
    if (line.startsWith('> ')) {
      return (
        <View key={index} style={[styles.quote, { borderLeftColor: tokens.accentWarm }]}>
          <Text style={[styles.quoteText, { color: tokens.inkMuted }]}>{line.slice(2)}</Text>
        </View>
      );
    }

    // 空行
    if (line.trim() === '') {
      return <View key={index} style={styles.emptyLine} />;
    }

    // 普通文本（处理行内格式）
    return <Text key={index} style={[styles.paragraph, { color: tokens.ink }]}>{line}</Text>;
  };

  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, index) => renderLine(line, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 2,
    paddingLeft: 16,
  },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 4,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emptyLine: {
    height: 8,
  },
});
