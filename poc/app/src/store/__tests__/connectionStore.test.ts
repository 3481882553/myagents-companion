/**
 * connectionStore 单元测试（PoC API）
 */
import { useConnectionStore } from '../connectionStore';

describe('connectionStore', () => {
  beforeEach(() => {
    useConnectionStore.getState().disconnect();
  });

  it('默认状态', () => {
    const s = useConnectionStore.getState();
    expect(s.status).toBe('disconnected');
    expect(s.host).toBeNull();
    expect(s.token).toBeNull();
  });

  it('setToken 设置 token', () => {
    useConnectionStore.getState().setToken('tok-123');
    expect(useConnectionStore.getState().token).toBe('tok-123');
  });

  it('setError 设置错误并更新 status', () => {
    useConnectionStore.getState().setError('连接超时');
    expect(useConnectionStore.getState().error).toBe('连接超时');
    expect(useConnectionStore.getState().status).toBe('error');
  });

  it('clearError 清除错误', () => {
    useConnectionStore.getState().setError('err');
    useConnectionStore.getState().clearError();
    expect(useConnectionStore.getState().error).toBeNull();
  });

  it('disconnect 重置所有状态', () => {
    useConnectionStore.getState().setToken('tok');
    useConnectionStore.getState().disconnect();
    expect(useConnectionStore.getState().status).toBe('disconnected');
    expect(useConnectionStore.getState().token).toBeNull();
    expect(useConnectionStore.getState().host).toBeNull();
  });
});
