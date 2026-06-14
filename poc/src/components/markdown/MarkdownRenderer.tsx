/**
 * MarkdownRenderer — 简化版 Markdown 渲染（PoC）
 * 支持：标题、列表、引用、粗体、斜体、行内代码、代码块
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightTokens, darkTokens } from '../../theme/tokens';

interface MarkdownRendererProps {
  content: string;
  theme?: 'light' | 'dark';
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // 简单处理：粗体、斜体、行内代码
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={key++}>{text.slice(lastIndex, match.index)}</Text>);
    }
    if (match[2]) {
      parts.push(<Text key={key++} style={{ fontWeight: '700' }}>{match[2]}</Text>);
    } else if (match[4]) {
      parts.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{match[4]}</Text>);
    } else if (match[6]) {
      parts.push(<Text key={key++} style={{ fontFamily: 'monospace', backgroundColor: 'rgba(28,22,18,0.06)', fontSize: 13, borderRadius: 3, paddingHorizontal: 4 }}>{match[6]}</Text>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Text key={key++}>{text.slice(lastIndex)}</Text>);
  }
  return parts.length > 0 ? parts : [<Text key={0}>{text}</Text>];
}

export function MarkdownRenderer({ content, theme = 'light' }: MarkdownRendererProps) {
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let key = 0;

  for (const line of lines) {
    // 代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={key++} style={styles.codeBlock}>
            <Text style={styles.codeText} selectable>{codeLines.join('\n')}</Text>
          </View>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 空行
    if (line.trim() === '') {
      elements.push(<View key={key++} style={{ height: 8 }} />);
      continue;
    }

    // 标题
    if (line.startsWith('### ')) {
      elements.push(<Text key={key++} style={[styles.h3, { color: tokens.ink }]}>{line.slice(4)}</Text>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<Text key={key++} style={[styles.h2, { color: tokens.ink }]}>{line.slice(3)}</Text>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<Text key={key++} style={[styles.h1, { color: tokens.ink }]}>{line.slice(2)}</Text>);
      continue;
    }

    // 列表
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <Text key={key++} style={[styles.listItem, { color: tokens.ink }]}>
          {renderInline('• ' + line.slice(2))}
        </Text>
      );
      continue;
    }

    // 有序列表
    const orderedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (orderedMatch) {
      elements.push(
        <Text key={key++} style={[styles.listItem, { color: tokens.ink }]}>
          {renderInline(`${orderedMatch[1]}. ${orderedMatch[2]}`)}
        </Text>
      );
      continue;
    }

    // 引用
    if (line.startsWith('> ')) {
      elements.push(
        <View key={key++} style={[styles.quote, { borderLeftColor: tokens.accentWarm }]}>
          <Text style={[styles.quoteText, { color: tokens.inkMuted }]}>{renderInline(line.slice(2))}</Text>
        </View>
      );
      continue;
    }

    // 分割线
    if (line.match(/^[-*_]{3,}$/)) {
      elements.push(<View key={key++} style={styles.hr} />);
      continue;
    }

    // 表格行（简化：跳过分隔行）
    if (line.startsWith('|') && line.match(/^\|[\s-|]+\|$/)) continue;

    // 普通段落
    elements.push(
      <Text key={key++} style={[styles.paragraph, { color: tokens.ink }]}>
        {renderInline(line)}
      </Text>
    );
  }

  return <View style={styles.container}>{elements}</View>;
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  h1: { fontSize: 22, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  h2: { fontSize: 19, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  h3: { fontSize: 17, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  listItem: { fontSize: 15, lineHeight: 22, marginBottom: 2, paddingLeft: 16 },
  quote: { borderLeftWidth: 3, paddingLeft: 12, marginVertical: 4 },
  quoteText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  codeBlock: {
    backgroundColor: 'rgba(28,22,18,0.06)', fontFamily: 'monospace', fontSize: 13,
    lineHeight: 18, padding: 12, borderRadius: 6, marginVertical: 8, overflow: 'scroll',
  },
  codeText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 18 },
  hr: { height: 1, backgroundColor: 'rgba(28,22,18,0.10)', marginVertical: 12 },
});
