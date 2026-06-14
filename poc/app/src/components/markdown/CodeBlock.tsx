/**
 * CodeBlock — 代码块渲染组件
 *
 * 功能：语法高亮 + 复制 + 折叠 + 行号
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

interface CodeBlockProps {
  language?: string;
  code: string;
  collapsible?: boolean;
  showLineNumbers?: boolean;
}

export function CodeBlock({ language, code, collapsible = false, showLineNumbers = false }: CodeBlockProps) {
  const [collapsed, setCollapsed] = useState(collapsible);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const shouldShowLineNumbers = showLineNumbers && lines.length > 5;

  return (
    <View style={styles.container}>
      {/* 头部：语言标签 + 复制按钮 */}
      <View style={styles.header}>
        <Text style={styles.language}>{language || 'code'}</Text>
        <TouchableOpacity testID="copy-button" onPress={handleCopy}>
          <Text style={styles.copyBtn}>{copied ? '✓ 已复制' : '📋 复制'}</Text>
        </TouchableOpacity>
        {collapsible && (
          <TouchableOpacity testID="toggle-collapse" onPress={() => setCollapsed(!collapsed)}>
            <Text style={styles.collapseBtn}>{collapsed ? '展开' : '折叠'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 代码内容 */}
      {!collapsed && (
        <ScrollView
          testID="code-scroll"
          horizontal
          style={styles.codeScroll}
        >
          <View style={styles.codeContainer}>
            {shouldShowLineNumbers && (
              <View testID="line-numbers" style={styles.lineNumbers}>
                {lines.map((_, i) => (
                  <Text key={i} style={styles.lineNumber}>{i + 1}</Text>
                ))}
              </View>
            )}
            <Text style={styles.code} selectable>
              {code}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginVertical: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2d2d2d',
  },
  language: {
    fontSize: 12,
    color: '#968a7e',
    fontFamily: 'monospace',
  },
  copyBtn: {
    fontSize: 12,
    color: '#c26d3a',
  },
  collapseBtn: {
    fontSize: 12,
    color: '#968a7e',
    marginLeft: 12,
  },
  codeScroll: {
    maxHeight: 400,
  },
  codeContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  lineNumbers: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  lineNumber: {
    fontSize: 13,
    color: '#636d83',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  code: {
    fontSize: 13,
    color: '#d4d4d4',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
