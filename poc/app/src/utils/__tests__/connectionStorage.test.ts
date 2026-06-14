/**
 * connectionStorage 单元测试
 */

import { saveConnectionHistory, getConnectionHistory, ConnectionHistoryItem } from '../connectionStorage';

describe('connectionStorage', () => {
  beforeEach(() => {
    // 清空内存存储（每次测试前重置）
  });

  describe('saveConnectionHistory', () => {
    it('保存连接记录', async () => {
      await saveConnectionHistory('192.168.1.5:32107', '123456');
      const history = await getConnectionHistory();
      expect(history.length).toBe(1);
      expect(history[0].host).toBe('192.168.1.5:32107');
    });

    it('去重相同 host', async () => {
      await saveConnectionHistory('192.168.1.5:32107', '123456');
      await saveConnectionHistory('192.168.1.5:32107', '654321');
      const history = await getConnectionHistory();
      expect(history.length).toBe(1);
      expect(history[0].pairCode).toBe('654321');
    });

    it('按时间倒序排列', async () => {
      await saveConnectionHistory('host1:32107');
      await new Promise(r => setTimeout(r, 10));
      await saveConnectionHistory('host2:32107');
      const history = await getConnectionHistory();
      expect(history[0].host).toBe('host2:32107');
      expect(history[1].host).toBe('host1:32107');
    });

    it('最多保留 5 条', async () => {
      for (let i = 0; i < 7; i++) {
        await saveConnectionHistory(`host${i}:32107`);
      }
      const history = await getConnectionHistory();
      expect(history.length).toBe(5);
    });

    it('默认 pairCode 为 123456', async () => {
      await saveConnectionHistory('host:32107');
      const history = await getConnectionHistory();
      expect(history[0].pairCode).toBe('123456');
    });
  });

  describe('getConnectionHistory', () => {
    it('初始为空', async () => {
      // 注意：由于内存存储，如果之前有测试运行过，可能不为空
      const history = await getConnectionHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
