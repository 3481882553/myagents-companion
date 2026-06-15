/**
 * sessionStore 单元测试（PoC API）
 */
import { useSessionStore } from '../sessionStore';

const makeSession = (id: string, title: string) => ({
  id, title, lastMessageAt: Date.now(), messageCount: 5, isInternal: false,
});

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().loadSessions([]);
    useSessionStore.getState().clearError();
  });

  it('默认状态', () => {
    const s = useSessionStore.getState();
    expect(s.sessions).toEqual([]);
    expect(s.currentSessionId).toBeNull();
    expect(s.loading).toBe(false);
  });

  it('loadSessions 加载会话列表', () => {
    const sessions = [makeSession('s1', 'A'), makeSession('s2', 'B')];
    useSessionStore.getState().loadSessions(sessions);
    expect(useSessionStore.getState().sessions).toHaveLength(2);
  });

  it('setSessions 设置会话列表', () => {
    const sessions = [makeSession('s3', 'C')];
    useSessionStore.getState().setSessions(sessions);
    expect(useSessionStore.getState().sessions).toEqual(sessions);
  });

  it('selectSession 选择会话', () => {
    useSessionStore.getState().selectSession('s1');
    expect(useSessionStore.getState().currentSessionId).toBe('s1');
  });

  it('appendMessage 增加消息计数', () => {
    useSessionStore.getState().loadSessions([makeSession('s1', 'A')]);
    useSessionStore.getState().appendMessage('s1');
    expect(useSessionStore.getState().sessions[0].messageCount).toBe(6);
  });

  it('updateSession 更新会话属性', () => {
    useSessionStore.getState().loadSessions([makeSession('s1', '旧名')]);
    useSessionStore.getState().updateSession('s1', { title: '新名' });
    expect(useSessionStore.getState().sessions[0].title).toBe('新名');
  });

  it('setError 和 clearError', () => {
    useSessionStore.getState().setError('错误');
    expect(useSessionStore.getState().error).toBe('错误');
    useSessionStore.getState().clearError();
    expect(useSessionStore.getState().error).toBeNull();
  });
});
