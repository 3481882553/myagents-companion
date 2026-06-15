/**
 * AuthService — 配对认证服务
 *
 * 职责：配对码验证、JWT Token 管理、过期检测
 */

import * as Keychain from 'react-native-keychain';
import { ISidecarApi } from './sidecar-api';

const SERVICE_NAME = 'myagents-token';

export interface PairResult {
  token: string;
  expiresIn: number;
}

export class AuthService {
  constructor(private api: ISidecarApi) {}

  /** 配对：验证配对码，返回 JWT Token */
  async pair(code: string): Promise<PairResult> {
    if (!code || code.length === 0) {
      throw new Error('配对码不能为空');
    }

    const result = await this.api.post<{ token: string; expiresIn: number }>('/api/pair', { code });

    // 存储 Token
    await Keychain.setGenericPassword(SERVICE_NAME, result.token);
    this.api.setToken(result.token);

    return result;
  }

  /** 读取存储的 Token */
  async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  }

  /** 删除 Token */
  async removeToken(): Promise<void> {
    await Keychain.resetGenericPassword();
    this.api.clearToken();
  }

  /** 检查 Token 是否过期 */
  isTokenExpired(expiryTime: number, bufferSeconds: number = 0): boolean {
    const now = Math.floor(Date.now() / 1000);
    return expiryTime - now < bufferSeconds;
  }

  /** 从 Token 中提取过期时间（JWT payload 的 exp 字段） */
  getTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.exp || null;
    } catch {
      return null;
    }
  }
}
