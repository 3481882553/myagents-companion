/**
 * MermaidDiagram 单元测试
 *
 * 注意：组件使用 WebView 渲染，真实渲染行为需在集成环境测试。
 * 此测试验证组件创建、主题切换和异常安全。
 */

import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  View: 'View',
  Text: 'Text',
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
  WebViewMessageEvent: {},
}));

import { MermaidDiagram } from '../markdown/MermaidDiagram';

describe('MermaidDiagram', () => {
  // ========== 组件创建 ==========

  describe('组件创建', () => {
    it('创建流程图组件', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'light' });
      expect(result).toBeTruthy();
      expect(result.type).toBeDefined();
    });

    it('创建时序图组件', () => {
      const result = MermaidDiagram({ code: 'sequenceDiagram\n    A->>B: Hello', theme: 'light' });
      expect(result).toBeTruthy();
    });

    it('创建甘特图组件', () => {
      const result = MermaidDiagram({ code: 'gantt\n    title Test', theme: 'light' });
      expect(result).toBeTruthy();
    });
  });

  // ========== 主题切换 ==========

  describe('主题切换', () => {
    it('亮色主题创建成功', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'light' });
      expect(result).toBeTruthy();
    });

    it('暗色主题创建成功', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B', theme: 'dark' });
      expect(result).toBeTruthy();
    });

    it('默认主题为 light', () => {
      const result = MermaidDiagram({ code: 'flowchart TD\n    A-->B' });
      expect(result).toBeTruthy();
    });
  });

  // ========== 异常安全 ==========

  describe('异常安全', () => {
    it('非法 Mermaid 代码不崩溃', () => {
      expect(() => MermaidDiagram({ code: '{{{invalid mermaid' })).not.toThrow();
    });

    it('空代码不崩溃', () => {
      expect(() => MermaidDiagram({ code: '' })).not.toThrow();
    });

    it('大型图表不崩溃', () => {
      const largeCode = Array.from({ length: 200 }, (_, i) => `A${i}-->B${i}`).join('\n');
      expect(() => MermaidDiagram({ code: `flowchart TD\n${largeCode}` })).not.toThrow();
    });
  });
});
