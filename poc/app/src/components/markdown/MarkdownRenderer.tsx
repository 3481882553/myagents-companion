/**
 * MarkdownRenderer — 基于 react-native-markdown-display 的 GFM 渲染
 * 支持：标题、列表、引用、粗体、斜体、行内代码、代码块、表格、任务列表
 */

import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { lightTokens, darkTokens } from '../../theme/tokens';

interface MarkdownRendererProps {
  content: string;
  theme?: 'light' | 'dark';
}

export function MarkdownRenderer({ content, theme }: MarkdownRendererProps) {
  const systemTheme = useColorScheme();
  const activeTheme = theme || (systemTheme === 'dark' ? 'dark' : 'light');
  const tokens = activeTheme === 'dark' ? darkTokens : lightTokens;
  const isDark = activeTheme === 'dark';

  if (!content) return null;

  return (
    <Markdown
      style={{
        body: { color: tokens.ink, fontSize: 15, lineHeight: 24, flex: 0 },
        heading1: {
          fontSize: 24, fontWeight: '700', color: tokens.ink,
          marginBottom: 8, marginTop: 16, lineHeight: 30,
        },
        heading2: {
          fontSize: 20, fontWeight: '600', color: tokens.ink,
          marginBottom: 6, marginTop: 12, lineHeight: 26,
        },
        heading3: {
          fontSize: 17, fontWeight: '600', color: tokens.ink,
          marginBottom: 4, marginTop: 8, lineHeight: 22,
        },
        paragraph: { marginBottom: 6, marginTop: 0, flex: 0 },
        list_item: { marginBottom: 2 },
        bullet_list: { marginBottom: 4 },
        ordered_list: { marginBottom: 4 },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: tokens.accentWarm,
          paddingLeft: 12,
          marginVertical: 4,
          backgroundColor: 'transparent',
        },
        code_inline: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          color: tokens.ink,
          fontFamily: 'monospace',
          fontSize: 13,
          paddingHorizontal: 4,
          borderRadius: 3,
        },
        code_block: {
          backgroundColor: isDark ? '#1e1e1e' : '#f4f4f4',
          color: tokens.ink,
          fontFamily: 'monospace',
          fontSize: 13,
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
        },
        fence: {
          backgroundColor: isDark ? '#1e1e1e' : '#f4f4f4',
          color: tokens.ink,
          fontFamily: 'monospace',
          fontSize: 13,
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
        },
        table: {
          borderWidth: 1,
          borderColor: 'rgba(28,22,18,0.12)',
          borderRadius: 4,
          marginVertical: 8,
        },
        thead: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        },
        th: {
          padding: 8,
          fontWeight: '600',
          color: tokens.ink,
          borderWidth: 1,
          borderColor: 'rgba(28,22,18,0.08)',
        },
        td: {
          padding: 8,
          color: tokens.ink,
          borderWidth: 1,
          borderColor: 'rgba(28,22,18,0.08)',
        },
        tr: {
          borderColor: 'rgba(28,22,18,0.08)',
        },
        hr: {
          backgroundColor: 'rgba(28,22,18,0.12)',
          height: 1,
          marginVertical: 16,
        },
        link: { color: '#3b82f6', textDecorationLine: 'underline' },
        s: { color: tokens.inkMuted, textDecorationLine: 'line-through' },
        em: { fontStyle: 'italic' },
        strong: { fontWeight: '700' },
      }}
    >
      {content}
    </Markdown>
  );
}
