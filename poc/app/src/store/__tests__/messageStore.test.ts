/**
 * messageStore 单元测试（PoC API）
 */
import { useMessageStore } from '../messageStore';
import type { Message } from '../../types/message';

const makeMsg = (overrides: Partial<Message> = {}): Message => ({
  id: 'm1', sessionId: 's1', role: 'user', content: 'hi',
  createdAt: Date.now(), status: 'sent', ...overrides,
});

describe('messageStore', () => {
  beforeEach(() => {
    useMessageStore.getState().clearMessages('s1');
    useMessageStore.getState().clearMessages('s2');
  });

  it('默认状态', () => {
    const s = useMessageStore.getState();
    expect(s.messages).toEqual({});
    expect(s.streaming).toEqual({});
    expect(s.loading).toBe(false);
  });

  it('loadMessages 加载消息', () => {
    useMessageStore.getState().loadMessages('s1', [makeMsg(), makeMsg({ id: 'm2' })]);
    expect(useMessageStore.getState().messages['s1']).toHaveLength(2);
  });

  it('appendMessage 追加消息', () => {
    useMessageStore.getState().appendMessage('s1', makeMsg());
    expect(useMessageStore.getState().messages['s1']).toHaveLength(1);
  });

  it('不同会话独立存储', () => {
    useMessageStore.getState().loadMessages('s1', [makeMsg()]);
    useMessageStore.getState().loadMessages('s2', [makeMsg({ id: 'm2' })]);
    expect(useMessageStore.getState().messages['s1']).toHaveLength(1);
    expect(useMessageStore.getState().messages['s2']).toHaveLength(1);
  });

  it('startStreaming 开始流', () => {
    useMessageStore.getState().startStreaming('m1');
    expect(useMessageStore.getState().streaming['m1']).toBe('');
  });

  it('appendChunk 追加文本', () => {
    useMessageStore.getState().startStreaming('m1');
    useMessageStore.getState().appendChunk('m1', 'Hello');
    useMessageStore.getState().appendChunk('m1', ' World');
    expect(useMessageStore.getState().streaming['m1']).toBe('Hello World');
  });

  it('completeStreaming 完成流', () => {
    useMessageStore.getState().startStreaming('m1');
    useMessageStore.getState().appendChunk('m1', 'Hi');
    useMessageStore.getState().completeStreaming('m1', 's1');
    expect(useMessageStore.getState().streaming['m1']).toBeUndefined();
    expect(useMessageStore.getState().messages['s1']).toHaveLength(1);
    expect(useMessageStore.getState().messages['s1'][0].role).toBe('assistant');
  });

  it('clearMessages 清除消息', () => {
    useMessageStore.getState().loadMessages('s1', [makeMsg()]);
    useMessageStore.getState().clearMessages('s1');
    expect(useMessageStore.getState().messages['s1']).toBeUndefined();
  });
});
