/**
 * ProcessRow — 工具调用折叠行
 *
 * v0.3 W2：与桌面端 ProcessRow 对齐的渲染协议。
 *
 * 视觉构成：
 * [状态点] [图标] [工具名] [副标签] [展开箭头]
 *
 * 状态颜色：running=绿色脉冲 / completed=灰色 / error=红色 / interrupted=黄色
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ProcessState = 'running' | 'completed' | 'error' | 'interrupted';

export interface ProcessRowProps {
  icon: string;
  name: string;
  subtitle?: string;
  state: ProcessState;
  isThinking?: boolean;
  /** 展开后的详情内容（React 元素） */
  children?: React.ReactNode;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
}

const STATE_COLORS: Record<ProcessState, string> = {
  running: '#2d8a5e',
  completed: '#968a7e',
  error: '#dc2626',
  interrupted: '#d97706',
};

const STATE_BG: Record<ProcessState, string> = {
  running: 'rgba(45, 138, 94, 0.08)',
  completed: 'transparent',
  error: 'rgba(220, 38, 38, 0.05)',
  interrupted: 'rgba(217, 119, 6, 0.05)',
};

export function ProcessRow({
  icon,
  name,
  subtitle,
  state,
  isThinking = false,
  children,
  defaultExpanded = false,
}: ProcessRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.container, { backgroundColor: STATE_BG[state] }]}>
      <TouchableOpacity
        testID={`process-row-${name}`}
        onPress={() => setExpanded(!expanded)}
        style={styles.row}
      >
        {/* 状态点 */}
        <View
          testID={`process-dot-${state}`}
          style={[styles.dot, { backgroundColor: STATE_COLORS[state] }]}
        />
        {/* 图标 */}
        <Text style={styles.icon}>{icon}</Text>
        {/* 工具名 */}
        <Text style={[styles.name, isThinking && styles.thinkingName]}>
          {name}
        </Text>
        {/* 副标签 */}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {/* 展开箭头 */}
        {children ? (
          <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
        ) : null}
      </TouchableOpacity>

      {/* 展开详情 */}
      {expanded && children ? (
        <View testID={`process-detail-${name}`} style={styles.detail}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1612',
    flexShrink: 0,
  },
  thinkingName: {
    fontStyle: 'italic',
    color: '#6f6156',
  },
  subtitle: {
    fontSize: 12,
    color: '#968a7e',
    marginLeft: 8,
    flex: 1,
  },
  arrow: {
    fontSize: 10,
    color: '#968a7e',
    marginLeft: 8,
  },
  detail: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 22, 18, 0.06)',
  },
});
