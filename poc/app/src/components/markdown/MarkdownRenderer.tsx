/**
 * MarkdownRenderer — 基于 react-native-markdown-display 的完整 Markdown 渲染
 *
 * 支持：GFM 表格、任务列表、删除线、行内代码、代码块
 */

import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { lightTokens, darkTokens, ThemeTokens } from '../../theme/tokens';

interface MarkdownRendererProps {
  content: string;
  theme?: 'light' | 'dark';
}

export function MarkdownRenderer({ content, theme = 'light' }: MarkdownRendererProps) {
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  if (!content) return null;

  const markdownStyles = {
    body: { color: tokens.ink, fontSize: 15, lineHeight: 22 },
    heading1: { fontSize: 22, fontWeight: '700' as const, marginTop: 12, marginBottom: 8 },
    heading2: { fontSize: 19, fontWeight: '600' as const, marginTop: 10, marginBottom: 6 },
    heading3: { fontSize: 17, fontWeight: '600' as const, marginTop: 8, marginBottom: 4 },
    paragraph: { marginTop: 4, marginBottom: 4 },
    link: { color: tokens.accentWarm, textDecorationLine: 'underline' as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: tokens.accentWarm,
      paddingLeft: 12,
      marginVertical: 4,
    },
    list_item: { marginVertical: 2 },
    bullet_list: { paddingLeft: 16 },
    ordered_list: { paddingLeft: 16 },
    code_inline: {
      backgroundColor: 'rgba(28, 22, 18, 0.06)',
      color: tokens.accentWarm,
      fontSize: 13,
      fontFamily: 'monospace',
      paddingHorizontal: 4,
      borderRadius: 3,
    },
    code_block: {
      backgroundColor: 'rgba(28, 22, 18, 0.06)',
      fontFamily: 'monospace',
      fontSize: 13,
      lineHeight: 18,
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
      overflow: 'scroll' as const,
    },
    fence: {
      backgroundColor: 'rgba(28, 22, 18, 0.06)',
      fontFamily: 'monospace',
      fontSize: 13,
      lineHeight: 18,
      padding: 12,
      borderRadius: 6,
      marginVertical: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: 'rgba(28, 22, 18, 0.10)',
      borderRadius: 6,
      marginVertical: 8,
    },
    th: {
      backgroundColor: 'rgba(28, 22, 18, 0.04)',
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(28, 22, 18, 0.10)',
    },
    td: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(28, 22, 18, 0.06)',
    },
    hr: {
      backgroundColor: 'rgba(28, 22, 18, 0.10)',
      height: 1,
      marginVertical: 12,
    },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    del: { textDecorationLine: 'line-through' as const },
  };

  return (
    <Markdown style={markdownStyles}>
      {content}
    </Markdown>
  );
}
