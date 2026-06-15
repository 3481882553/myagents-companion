/**
 * 设计 Token 单元测试
 *
 * 覆盖：
 * - 亮色模式 token 值
 * - 暗色模式 token 值
 * - 主题切换
 */

import { lightTokens, darkTokens } from '../tokens';

describe('Design Tokens', () => {
  // ========== 亮色模式 ==========

  describe('亮色模式', () => {
    it('背景色正确', () => {
      expect(lightTokens.paper).toBe('#faf6ee');
    });

    it('文字色正确', () => {
      expect(lightTokens.ink).toBe('#1c1612');
    });

    it('强调色正确', () => {
      expect(lightTokens.accentWarm).toBe('#c26d3a');
    });

    it('次要文字色正确', () => {
      expect(lightTokens.inkSecondary).toBe('#2e2825');
    });

    it('弱化文字色正确', () => {
      expect(lightTokens.inkMuted).toBe('#6f6156');
    });
  });

  // ========== 暗色模式 ==========

  describe('暗色模式', () => {
    it('背景色正确', () => {
      expect(darkTokens.paper).toBe('#1a1614');
    });

    it('文字色正确', () => {
      expect(darkTokens.ink).toBe('#e4dcd4');
    });

    it('强调色正确', () => {
      expect(darkTokens.accentWarm).toBe('#d4803f');
    });

    it('次要文字色正确', () => {
      expect(darkTokens.inkSecondary).toBe('#cfc5ba');
    });

    it('弱化文字色正确', () => {
      expect(darkTokens.inkMuted).toBe('#968a7e');
    });
  });

  // ========== 主题对比 ==========

  describe('主题对比', () => {
    it('亮色和暗色模式有不同的背景色', () => {
      expect(lightTokens.paper).not.toBe(darkTokens.paper);
    });

    it('亮色和暗色模式有不同的文字色', () => {
      expect(lightTokens.ink).not.toBe(darkTokens.ink);
    });

    it('亮色和暗色模式有不同的强调色', () => {
      expect(lightTokens.accentWarm).not.toBe(darkTokens.accentWarm);
    });
  });

  // ========== Token 完整性 ==========

  describe('Token 完整性', () => {
    it('亮色模式包含所有必要 token', () => {
      expect(lightTokens.paper).toBeDefined();
      expect(lightTokens.paperElevated).toBeDefined();
      expect(lightTokens.paperInset).toBeDefined();
      expect(lightTokens.ink).toBeDefined();
      expect(lightTokens.inkSecondary).toBeDefined();
      expect(lightTokens.inkMuted).toBeDefined();
      expect(lightTokens.accentWarm).toBeDefined();
      expect(lightTokens.accentCool).toBeDefined();
    });

    it('暗色模式包含所有必要 token', () => {
      expect(darkTokens.paper).toBeDefined();
      expect(darkTokens.paperElevated).toBeDefined();
      expect(darkTokens.paperInset).toBeDefined();
      expect(darkTokens.ink).toBeDefined();
      expect(darkTokens.inkSecondary).toBeDefined();
      expect(darkTokens.inkMuted).toBeDefined();
      expect(darkTokens.accentWarm).toBeDefined();
      expect(darkTokens.accentCool).toBeDefined();
    });
  });
});
