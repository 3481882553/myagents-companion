/**
 * ToolCallRow — 工具调用折叠行
 *
 * 折叠态：[状态点] [图标] 工具名  副标签  [展开箭头]
 * 展开态：工具详情（命令/文件路径/结果摘要）
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ToolCallInfo {
  name: string;
  input?: string;
  result?: string;
  state?: 'running' | 'completed' | 'error';
}

interface ToolCallRowProps {
  tool: ToolCallInfo;
}

const TOOL_ICONS: Record<string, string> = {
  Bash: '💻',
  Read: '📄',
  Write: '✏️',
  Edit: '📝',
  Grep: '🔍',
  Glob: '🔎',
  WebFetch: '🌐',
  WebSearch: '🌐',
  Skill: '✨',
  Task: '⚡',
  Agent: '⚡',
  TodoWrite: '📋',
  TaskCreate: '📋',
  TaskUpdate: '📋',
};

function getStatusColor(state?: string): string {
  switch (state) {
    case 'running': return '#22c55e';
    case 'error': return '#ef4444';
    default: return '#9ca3af';
  }
}

function getSubLabel(tool: ToolCallInfo): string {
  try {
    const input = JSON.parse(tool.input || '{}');
    if (tool.name === 'Bash') return (input.command || '').slice(0, 40);
    if (tool.name === 'Read' || tool.name === 'Write' || tool.name === 'Edit') return input.file_path || '';
    if (tool.name === 'Grep') return input.pattern || '';
    if (tool.name === 'Glob') return input.pattern || '';
    return '';
  } catch {
    return '';
  }
}

export function ToolCallRow({ tool }: ToolCallRowProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[tool.name] || '🔧';
  const subLabel = getSubLabel(tool);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(tool.state) }]} />
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.name} numberOfLines={1}>{tool.name}</Text>
        {subLabel ? (
          <Text style={styles.subLabel} numberOfLines={1}>{subLabel}</Text>
        ) : null}
        <Text style={styles.arrow}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {tool.input && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>输入</Text>
              <Text style={styles.detailText} selectable>
                {formatJson(tool.input)}
              </Text>
            </View>
          )}
          {tool.result && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>结果</Text>
              <Text style={styles.detailText} selectable numberOfLines={50}>
                {tool.result}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.08)',
    backgroundColor: 'rgba(28, 22, 18, 0.02)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  icon: {
    fontSize: 14,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1612',
  },
  subLabel: {
    fontSize: 12,
    color: '#968a7e',
    flex: 1,
    marginLeft: 4,
  },
  arrow: {
    fontSize: 12,
    color: '#968a7e',
  },
  expanded: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 22, 18, 0.06)',
    padding: 10,
  },
  detailBlock: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6f6156',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1c1612',
    lineHeight: 18,
  },
});
