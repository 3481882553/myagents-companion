/**
 * JoseTokenService 单元测试
 *
 * 测试覆盖：
 * - Token 签发
 * - Token 验证
 * - 过期处理
 * - 篡改检测
 * - 不同 secret 拒绝
 */

import { JoseTokenService } from '../token-service';
import type { ITokenService } from '../token-service';

const TEST_SECRET = new TextEncoder().encode('test-secret-key-at-least-32-chars!');

function createService(secret?: Uint8Array): ITokenService {
  return new JoseTokenService(secret || TEST_SECRET);
}

describe('JoseTokenService', () => {
  describe('sign', () => {
    it('签发格式正确的 JWT（三段式）', async () => {
      const service = createService();
      const token = await service.sign({ paired: true }, '7d');
      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3);
    });

    it('签发的 Token 可被验证', async () => {
      const service = createService();
      const token = await service.sign({ paired: true, device: 'Android' }, '7d');
      const payload = await service.verify(token);
      expect(payload.paired).toBe(true);
      expect(payload.device).toBe('Android');
    });

    it('不同 payload 生成不同 Token', async () => {
      const service = createService();
      const token1 = await service.sign({ paired: true }, '7d');
      const token2 = await service.sign({ paired: false }, '7d');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verify', () => {
    it('验证有效 Token 返回 payload', async () => {
      const service = createService();
      const token = await service.sign({ paired: true }, '7d');
      const payload = await service.verify(token);
      expect(payload).toBeDefined();
      expect(payload.paired).toBe(true);
    });

    it('拒绝过期 Token', async () => {
      const service = createService();
      // '0s' 表示立即过期
      const token = await service.sign({ paired: true }, '0s');
      // 等待一小段时间确保 Token 过期
      await new Promise(r => setTimeout(r, 1500));
      await expect(service.verify(token)).rejects.toThrow();
    });

    it('拒绝篡改的 Token', async () => {
      const service = createService();
      const token = await service.sign({ paired: true }, '7d');
      // 篡改 Token 的最后几个字符
      const tampered = token.slice(0, -5) + 'XXXXX';
      await expect(service.verify(tampered)).rejects.toThrow();
    });

    it('拒绝空字符串', async () => {
      const service = createService();
      await expect(service.verify('')).rejects.toThrow();
    });

    it('拒绝非 JWT 格式字符串', async () => {
      const service = createService();
      await expect(service.verify('not-a-jwt')).rejects.toThrow();
    });

    it('拒绝不同 secret 签发的 Token', async () => {
      const service1 = createService(TEST_SECRET);
      const otherSecret = new TextEncoder().encode('different-secret-key-at-least-32!');
      const service2 = createService(otherSecret);

      const token = await service2.sign({ paired: true }, '7d');
      await expect(service1.verify(token)).rejects.toThrow();
    });
  });
});
