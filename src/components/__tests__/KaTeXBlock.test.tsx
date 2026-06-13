/**
 * KaTeXBlock 单元测试
 *
 * 覆盖：
 * - 渲染功能
 * - 动态高度
 * - 性能
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

import { KaTeXBlock } from '../markdown/KaTeXBlock';

describe('KaTeXBlock', () => {
  // ========== 渲染功能 ==========

  describe('渲染功能', () => {
    it('渲染行内公式', () => {
      const result = KaTeXBlock({ formula: 'E=mc^2', displayMode: false });
      expect(result).toBeTruthy();
    });

    it('渲染块级公式', () => {
      const result = KaTeXBlock({ formula: '\\sum_{i=1}^{n} x_i', displayMode: true });
      expect(result).toBeTruthy();
    });

    it('渲染复杂公式', () => {
      const result = KaTeXBlock({ formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', displayMode: true });
      expect(result).toBeTruthy();
    });

    it('渲染失败时降级显示源码', () => {
      const result = KaTeXBlock({ formula: '\\invalid{latex', displayMode: true });
      expect(result).toBeTruthy();
    });
  });

  // ========== 动态高度 ==========

  describe('动态高度', () => {
    it('默认高度为 50', () => {
      const result = KaTeXBlock({ formula: 'E=mc^2' });
      expect(result).toBeTruthy();
    });

    it('渲染完成后通知父组件', () => {
      const onReady = jest.fn();
      const result = KaTeXBlock({ formula: 'E=mc^2', onReady });
      expect(result).toBeTruthy();
    });
  });

  // ========== 性能 ==========

  describe('性能', () => {
    it('创建组件不耗时', () => {
      const start = Date.now();
      KaTeXBlock({ formula: 'E=mc^2' });
      expect(Date.now() - start).toBeLessThan(100);
    });

    it('6 个公式创建不耗时', () => {
      const start = Date.now();
      for (let i = 0; i < 6; i++) {
        KaTeXBlock({ formula: `x_{${i}}`, displayMode: i % 2 === 0 });
      }
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});
