/**
 * BashTool 渲染 PoC
 *
 * 验证项：
 * - 终端风格输出渲染
 * - 折叠/展开交互
 * - 长输出滚动性能
 * - 复制功能
 * - exitCode/duration 显示
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';

interface BashResult {
  command: string;
  description?: string;
  output: string;
  exitCode: number;
  duration: number;
  cwd?: string;
}

// 模拟数据
const DEMO_RESULTS: BashResult[] = [
  {
    command: 'ls -la /home/user/project',
    description: '列出项目目录文件',
    output: `total 56
drwxr-xr-x  8 user user 4096 Jun 13 10:00 .
drwxr-xr-x  3 user user 4096 Jun 13 09:00 ..
-rw-r--r--  1 user user  220 Jun 13 09:00 .bashrc
-rw-r--r--  1 user user  807 Jun 13 09:00 .profile
drwxr-xr-x  2 user user 4096 Jun 13 10:00 src
drwxr-xr-x  2 user user 4096 Jun 13 10:00 tests
-rw-r--r--  1 user user 1234 Jun 13 10:00 package.json
-rw-r--r--  1 user user 5678 Jun 13 10:00 README.md`,
    exitCode: 0,
    duration: 52,
    cwd: '/home/user',
  },
  {
    command: 'npm test -- --coverage',
    description: '运行测试并生成覆盖率报告',
    output: `PASS  src/services/helper/HelperSessionService.test.ts
PASS  src/services/__tests__/SseClient.test.ts
PASS  src/db/__tests__/SqliteMessageCache.test.ts

Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        3.421s

----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.71 |    72.22 |   88.89 |   85.71 |
 helper   |   91.67 |    80.00 |  100.00 |   91.67 |
 db       |   80.00 |    66.67 |   75.00 |   80.00 |
----------|---------|----------|---------|---------|`,
    exitCode: 0,
    duration: 3421,
    cwd: '/home/user/project',
  },
  {
    command: 'git log --oneline -5',
    description: '查看最近 5 条提交',
    output: `faea0e0 test: 新增单元测试 — 服务层/SSE/缓存/Token/颜色 73 个用例
771278b docs: 新增 v3.0 测试方案
6ff72e4 refactor: SOLID 原则应用 — 接口抽象/依赖注入/服务拆分
31b7fd6 docs: 新增 §14 SOLID 架构设计原则实现指南
c7a2b88 fix: 工具清单修正/深度链接安全/Admin API 白名单/session_id 机制`,
    exitCode: 0,
    duration: 23,
    cwd: '/home/user/project',
  },
  {
    command: 'cat /nonexistent/file',
    description: '读取不存在的文件（错误示例）',
    output: `cat: /nonexistent/file: No such file or directory`,
    exitCode: 1,
    duration: 5,
  },
];

function BashToolItem({ result }: { result: BashResult }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // PoC: 模拟复制
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = result.exitCode !== 0;

  return (
    <View style={styles.toolCard}>
      {/* 命令头部 */}
      <TouchableOpacity
        testID="bash-toggle"
        style={styles.commandHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.prompt}>$_</Text>
        <Text style={styles.command} numberOfLines={expanded ? undefined : 1}>
          {result.command}
        </Text>
        {result.description && (
          <Text style={styles.description}>{result.description}</Text>
        )}
      </TouchableOpacity>

      {/* 输出区域 */}
      {expanded && (
        <View testID="bash-output" style={styles.outputContainer}>
          <ScrollView
            testID="bash-output-scroll"
            style={styles.outputScroll}
            nestedScrollEnabled={true}
          >
            <ScrollView horizontal nestedScrollEnabled={true}>
              <Text style={[styles.output, isError && styles.outputError]} selectable>
                {result.output}
              </Text>
            </ScrollView>
          </ScrollView>
        </View>
      )}

      {/* 底部元数据 */}
      <View style={styles.metaBar}>
        <View style={styles.metaLeft}>
          {result.cwd && (
            <Text style={styles.metaText}>📁 {result.cwd}</Text>
          )}
          <Text style={styles.metaText}>⏱ {result.duration < 1000 ? `${result.duration}ms` : `${(result.duration / 1000).toFixed(1)}s`}</Text>
          {isError && (
            <Text style={[styles.metaText, styles.metaError]}>exit: {result.exitCode}</Text>
          )}
        </View>
        <TouchableOpacity testID="bash-copy" onPress={handleCopy}>
          <Text style={styles.copyBtn}>{copied ? '✓ 已复制' : '📋 复制'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BashToolDemo() {
  // 长输出测试
  const longOutput = Array.from({ length: 1000 }, (_, i) => `line ${i}: ${'x'.repeat(80)}`).join('\n');
  const longResult: BashResult = {
    command: 'seq 1 1000',
    description: '1000 行长输出测试',
    output: longOutput,
    exitCode: 0,
    duration: 15,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>BashTool 渲染 PoC</Text>

      {DEMO_RESULTS.map((r, i) => (
        <BashToolItem key={i} result={r} />
      ))}

      <Text style={styles.sectionTitle}>长输出测试（1000 行）</Text>
      <BashToolItem result={longResult} />

      <Text style={styles.note}>
        验证项：
        {'\n'}• 命令/输出/元数据正确显示
        {'\n'}• 折叠/展开交互流畅
        {'\n'}• 长输出滚动无卡顿
        {'\n'}• 错误状态（exitCode ≠ 0）有视觉区分
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#faf6ee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1612',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e2825',
    marginTop: 16,
    marginBottom: 12,
  },
  toolCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2d2d2d',
  },
  prompt: {
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: 14,
    marginRight: 8,
  },
  command: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
    fontSize: 14,
    flex: 1,
  },
  description: {
    color: '#6f6156',
    fontSize: 12,
    marginLeft: 8,
  },
  outputContainer: {
    padding: 12,
  },
  outputScroll: {
    maxHeight: 500,
  },
  output: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
  },
  outputError: {
    color: '#ef4444',
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  metaLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    color: '#6f6156',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  metaError: {
    color: '#ef4444',
  },
  copyBtn: {
    color: '#c26d3a',
    fontSize: 12,
  },
  note: {
    fontSize: 13,
    color: '#6f6156',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 32,
  },
});
