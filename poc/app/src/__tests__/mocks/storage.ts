/**
 * Mock IKeyValueStorage — 用于所有依赖存储的服务测试
 */

interface IKeyValueStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

export class MockStorage implements IKeyValueStorage {
  private data = new Map<string, string>();

  getString = jest.fn((key: string) => this.data.get(key));
  set = jest.fn((key: string, value: string) => this.data.set(key, value));
  delete = jest.fn((key: string) => this.data.delete(key));

  /** 清空存储 */
  clear() {
    this.data.clear();
    this.getString.mockClear();
    this.set.mockClear();
    this.delete.mockClear();
  }

  /** 预设数据 */
  seed(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      this.data.set(key, value);
    }
  }
}
