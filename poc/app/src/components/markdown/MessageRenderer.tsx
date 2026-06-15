/**
 * MessageRenderer — 消息渲染组件
 *
 * 功能：区分用户/AI/系统消息，渲染 Markdown 内容
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CodeBlock } from './CodeBlock';
import { lightTokens, darkTokens } from '../../theme/tokens';

interface MessageRendererProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  theme?: 'light' | 'dark';
}

export function MessageRenderer({ role, content, theme = 'light' }: MessageRendererProps) {
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  // 用户消息：右对齐有气泡
  if (role === 'user') {
    return (
      <View testID="user-message" style={styles.userContainer}>
        <View style={[styles.userBubble, { backgroundColor: tokens.paperElevated, borderColor: tokens.line }]}>
          <Text style={[styles.userText, { color: tokens.ink }]}>{content}</Text>
        </View>
      </View>
    );
  }

  // 系统消息：居中显示
  if (role === 'system') {
    return (
      <View testID="system-message" style={styles.systemContainer}>
        <Text style={[styles.systemText, { color: tokens.inkMuted }]}>{content}</Text>
      </View>
    );
  }

  // AI 消息：左对齐无气泡，渲染 Markdown
  return (
    <View testID="assistant-message" style={styles.assistantContainer}>
      <MarkdownRenderer content={content} theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  userBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
  },
  assistantContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
