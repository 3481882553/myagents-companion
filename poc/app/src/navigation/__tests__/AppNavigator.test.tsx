/**
 * AppNavigator 单元测试
 * v0.2 架构升级 — React Navigation
 *
 * 覆盖：
 * - 导航器定义
 * - 路由配置
 * - 深度链接配置
 */

import { linking } from '../LinkingConfig';

describe('AppNavigator', () => {
  // ========== 深度链接配置 ==========

  describe('LinkingConfig', () => {
    it('有正确的 prefix', () => {
      expect(linking.prefixes).toContain('myagents://');
    });

    it('有正确的路由配置', () => {
      expect(linking.config.screens).toBeDefined();
      expect(linking.config.screens.Home).toBe('');
      expect(linking.config.screens.Connection).toBe('connect');
      expect(linking.config.screens.SessionList).toBe('sessions');
      expect(linking.config.screens.Chat).toBe('chat/:sessionId');
      expect(linking.config.screens.Helper).toBe('helper');
    });

    it('有所有必需的路由', () => {
      const screens = Object.keys(linking.config.screens);
      expect(screens).toContain('Home');
      expect(screens).toContain('Connection');
      expect(screens).toContain('SessionList');
      expect(screens).toContain('Chat');
      expect(screens).toContain('Helper');
    });
  });

  // ========== 路由参数 ==========

  describe('路由参数', () => {
    it('Chat 路由有 sessionId 参数', () => {
      expect(linking.config.screens.Chat).toContain(':sessionId');
    });
  });
});
