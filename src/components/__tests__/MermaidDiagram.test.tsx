/**
 * MermaidDiagram 单元测试
 *
 * 覆盖：
 * - 渲染功能
 * - 降级策略
 * - 主题切换
 */

import React from 'react';

// Mock react-native
jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

import { MermaidDiagram } from '../markdown/MermaidDiagram';

describe('MermaidDiagram', () => {
  // ========== 渲染功能 ==========

  describe('渲染功能', () => {
    it('渲染流程图', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'light' });
      expect(result).toBeTruthy();
    });

    it('渲染时序图', () => {
      const result = MermaidDiagram({ code: 'sequenceDiagram\n    A->>B: Hello', theme: 'light' });
      expect(result).toBeTruthy();
    });

    it('渲染甘特图', () => {
      const result = MermaidDiagram({ code: 'gantt\n    title Test', theme: 'light' });
      expect(result).toBeTruthy();
    });
  });

  // ========== 主题切换 ==========

  describe('主题切换', () => {
    it('亮色主题', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'light' });
      expect(result).toBeTruthy();
    });

    it('暗色主题', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'dark' });
      expect(result).toBeTruthy();
    });
  });

  // ========== 降级策略 ==========

  describe('降级策略', () => {
    it('无效 Mermaid 代码不崩溃', () => {
      expect(() => MermaidDiagram({ code: 'invalid mermaid code {{{', theme: 'light' })).not.toThrow();
    });

    it('空代码不崩溃', () => {
      expect(() => MermaidDiagram({ code: '', theme: 'light' })).not.toThrow();
    });
  });

  // ========== 性能 ==========

  describe('性能', () => {
    it('创建组件不耗时', () => {
      const start = Date.now();
      MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'light' });
      expect(Date.now() - start).toBeLessThan(100);
    });

    it('大型图表创建不耗时', () => {
      const largeCode = Array.from({ length: 50 }, (_, i) => `A${i}-->B${i}`).join('\n');
      const start = Date.now();
      MermaidDiagram({ code: `flowchart TD\n${largeCode}`, theme: 'light' });
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});
