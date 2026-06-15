/**
 * useDeepLink Hook 单元测试
 *
 * 覆盖：
 * - URL 解析（有效/无效/缺少参数）
 * - Host 白名单验证
 */

import { parseDeepLink, validateHost } from '../useDeepLink';

describe('useDeepLink', () => {
  // ========== URL 解析 ==========

  describe('parseDeepLink', () => {
    it('解析有效的深度链接', () => {
      const result = parseDeepLink('myagents://s/ses_abc123?h=192.168.1.5:32101');
      expect(result).toEqual({
        sessionId: 'ses_abc123',
        host: '192.168.1.5:32101',
      });
    });

    it('缺少 host 返回 null', () => {
      const result = parseDeepLink('myagents://s/ses_abc123');
      expect(result).toBeNull();
    });

    it('缺少 session_id 返回 null', () => {
      const result = parseDeepLink('myagents://s/?h=192.168.1.5:32101');
      expect(result).toBeNull();
    });

    it('无效 URL 返回 null', () => {
      const result = parseDeepLink('invalid://url');
      expect(result).toBeNull();
    });

    it('空字符串返回 null', () => {
      const result = parseDeepLink('');
      expect(result).toBeNull();
    });
  });

  // ========== Host 白名单验证 ==========

  describe('validateHost', () => {
    it('已配对的 host 返回 true', () => {
      const pairedHosts = ['192.168.1.5:32101', '10.0.0.1:32101'];
      expect(validateHost('192.168.1.5:32101', pairedHosts)).toBe(true);
    });

    it('未配对的 host 返回 false', () => {
      const pairedHosts = ['192.168.1.5:32101'];
      expect(validateHost('evil.com:443', pairedHosts)).toBe(false);
    });

    it('空白名单返回 false', () => {
      expect(validateHost('192.168.1.5:32101', [])).toBe(false);
    });
  });
});
