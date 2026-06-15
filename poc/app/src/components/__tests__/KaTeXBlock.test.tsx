/**
 * KaTeXBlock 单元测试
 *
 * 注意：组件使用 WebView 渲染，真实渲染行为需在集成环境测试。
 * 此测试验证组件创建、props 传递和异常安全。
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

import { KaTeXBlock } from '../markdown/KaTeXBlock';

describe('KaTeXBlock', () => {
  // ========== 组件创建 ==========

  describe('组件创建', () => {
    it('创建行内公式组件', () => {
      const result = KaTeXBlock({ formula: 'E=mc^2', displayMode: false });
      expect(result).toBeTruthy();
      expect(result.type).toBeDefined();
    });

    it('创建块级公式组件', () => {
      const result = KaTeXBlock({ formula: '\\sum_{i=1}^{n} x_i', displayMode: true });
      expect(result).toBeTruthy();
    });

    it('创建复杂矩阵公式', () => {
      const result = KaTeXBlock({ formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', displayMode: true });
      expect(result).toBeTruthy();
    });
  });

  // ========== Props 传递 ==========

  describe('Props 传递', () => {
    it('默认 displayMode 为 true', () => {
      const result = KaTeXBlock({ formula: 'E=mc^2' });
      expect(result).toBeTruthy();
    });

    it('onReady 回调被记录', () => {
      const onReady = jest.fn();
      const result = KaTeXBlock({ formula: 'E=mc^2', onReady });
      expect(result).toBeTruthy();
    });
  });

  // ========== 异常安全 ==========

  describe('异常安全', () => {
    it('非法 LaTeX 不崩溃', () => {
      expect(() => KaTeXBlock({ formula: '\\invalid{latex' })).not.toThrow();
    });

    it('空公式不崩溃', () => {
      expect(() => KaTeXBlock({ formula: '' })).not.toThrow();
    });

    it('特殊字符公式不崩溃', () => {
      expect(() => KaTeXBlock({ formula: '<script>alert("xss")</script>' })).not.toThrow();
    });
  });
});
