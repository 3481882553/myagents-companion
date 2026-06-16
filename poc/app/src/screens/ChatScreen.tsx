/**
 * ChatScreen — 聊天界面
 *
 * 功能：消息列表 + 输入框 + SSE 流式渲染
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { StreamingMessageRenderer } from '../components/markdown/StreamingMessageRenderer';
import { ToolCallRow, ToolCallInfo } from '../components/tools/ToolCallRow';
import { useConnectionStore } from '../store/connectionStore';
import { useMessageStore } from '../store/messageStore';
import { StorageService } from '../services/StorageService';
import { SseClient } from '../services/sse-client';
import { sseEventToStoreAction } from '../services/sse-event-handler';
import type { Message } from '../types/message';

/** 可折叠思考块 */
function ThinkingBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = thinking.slice(0, 100);
  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={thinkingStyles.block}
    >
      <Text style={thinkingStyles.label}>
        {expanded ? '🔽 思考过程' : '▶ 思考过程'} — {preview}{!expanded && thinking.length > 100 ? '...' : ''}
      </Text>
      {expanded && <Text style={thinkingStyles.text}>{thinking}</Text>}
    </TouchableOpacity>
  );
}

const thinkingStyles = StyleSheet.create({
  block: {
    backgroundColor: 'rgba(28, 22, 18, 0.04)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#968a7e',
  },
  label: { fontSize: 12, color: '#968a7e', fontStyle: 'italic' },
  text: { fontSize: 13, color: '#6f6156', fontStyle: 'italic', lineHeight: 18, marginTop: 6 },
});

/** 从消息 content 中提取纯文本（支持嵌套 JSON） */
function extractText(content: any): string {
  if (!content) return '';

  // 直接是字符串且不是 JSON
  if (typeof content === 'string' && !content.startsWith('[') && !content.startsWith('{')) {
    return content;
  }

  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    // 直接数组 [{"type":"text","text":"..."}, {"type":"tool_result","content":"..."}]
    if (Array.isArray(parsed)) {
      return parsed
        .map((b: any) => {
          if (b.type === 'text' && b.text) return b.text;
          if (b.type === 'tool_result' && typeof b.content === 'string') return b.content;
          if (b.type === 'tool_result' && Array.isArray(b.content)) {
            return b.content.filter((c: any) => c.type === 'text' && c.text).map((c: any) => c.text).join('\n');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    // 嵌套对象 {"role":"user","content":"文本"} 或 {"role":"assistant","content":[...]}
    if (parsed && typeof parsed === 'object' && parsed.content !== undefined) {
      return extractText(parsed.content);
    }
  } catch {}
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/** 解析 assistant 消息的 content 为 text + tool_call 数组 */
function parseAssistantContent(content: string): { text: string; tools: ToolCallInfo[] } {
  try {
    let blocks: any[] = [];

    const parsed = JSON.parse(content);

    // 情况1: 直接是数组 [{"type":"text","text":"..."}]
    if (Array.isArray(parsed)) {
      blocks = parsed;
    }
    // 情况2: 嵌套消息对象 {"id":...,"role":"assistant","content":[...]}
    else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.content)) {
      blocks = parsed.content;
    }
    // 情况3: 嵌套且 content 是字符串
    else if (parsed && typeof parsed === 'object' && typeof parsed.content === 'string') {
      const inner = JSON.parse(parsed.content);
      if (Array.isArray(inner)) blocks = inner;
    }

    if (blocks.length === 0) return { text: content, tools: [] };

    let text = '';
    const tools: ToolCallInfo[] = [];

    for (const block of blocks) {
      if (block.type === 'text' && block.text) {
        text += block.text;
      } else if (block.type === 'tool_use') {
        tools.push({
          name: block.name || 'Unknown',
          input: typeof block.input === 'string' ? block.input : JSON.stringify(block.input || {}),
          state: 'completed',
        });
      } else if (block.type === 'thinking' && block.thinking) {
        // thinking 块也显示为工具调用行
        tools.push({
          name: 'Thinking',
          input: block.thinking.slice(0, 500),
          state: 'completed',
        });
      }
    }

    return { text: text.trim(), tools };
  } catch {
    return { text: content, tools: [] };
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const TAG = '[ChatScreen]';

export function ChatScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollViewRef = useRef<any>(null);
  const hasScrolledToBottom = useRef(false);
  const messageCountRef = useRef(0);

  // 从 store 读取消息（替代本地 displayMessages state）
  const storeMessages = useMessageStore(state => state.messages[sessionId]) || [];

  const { host, token } = useConnectionStore();
  const { loadMessagesFromApi, sendMessage, loadMessages } = useMessageStore();
  const sseClientRef = useRef<SseClient | null>(null);

  /** 添加消息到 store（封装 appendMessage） */
  const appendToStore = useCallback((sid: string, msg: Message) => {
    useMessageStore.getState().appendMessage(sid, msg);
  }, []);

  // 卸载时断开 SSE
  useEffect(() => {
    return () => {
      if (sseClientRef.current) {
        console.log(TAG, '断开 SSE 连接');
        sseClientRef.current.disconnect();
        sseClientRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log(TAG, '屏幕已挂载, sessionId:', sessionId, 'host:', host || '(未设置)');
    return () => console.log(TAG, '屏幕将卸载, sessionId:', sessionId);
  }, [sessionId]);

  // 过滤消息（从 store 读取）
  const filteredMessages = useMemo(() => {
    return storeMessages.filter(msg => {
      const hasContent = msg.content && msg.content.trim() !== '';
      const hasTools = (msg.toolCalls || []).length > 0;
      const hasThinking = !!msg.thinking;
      if (!hasContent && !hasTools && !hasThinking) return false;
      if (msg.content?.startsWith('<command-name>') || msg.content?.startsWith('<local-command-')) return false;
      return true;
    });
  }, [storeMessages]);

  // 首次加载：从 API 获取历史消息
  useEffect(() => {
    if (!host) {
      useMessageStore.getState().clearMessages(sessionId);
      setLoading(false);
      return;
    }

    const loadMsgs = async () => {
      setLoadError(null);
      setLoading(true);
      try {
        // 先加载本地缓存
        const cached = await StorageService.getSessionCache(sessionId);
        if (cached.length > 0) {
          useMessageStore.getState().loadMessages(sessionId, cached);
        }
        // 再从 API 加载最新
        const msgs = await loadMessagesFromApi(sessionId, host, token || '');
        useMessageStore.getState().loadMessages(sessionId, msgs);
        // 缓存
        StorageService.saveSessionCache(sessionId, msgs);
      } catch (err: any) {
        console.warn(TAG, '消息加载失败:', err?.message);
        setLoadError('加载失败，请检查连接后下拉刷新');
      } finally {
        setLoading(false);
      }
    };

    loadMsgs();
  }, [sessionId, host, token]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    console.log(TAG, 'handleSend:', { sessionId, textLen: text.length });

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sessionId,
      role: 'user',
      content: text,
      createdAt: Date.now(),
      status: 'sent',
    };

    // 1. 添加用户消息到 store
    appendToStore(sessionId, userMessage);
    setInputText('');

    // 2. 如果已连接，发送到 Sidecar 并建立 SSE 流
    if (host && token) {
      try {
        console.log(TAG, '发送到 Sidecar...');
        const ok = await sendMessage(sessionId, text, host, token);
        if (!ok) {
          console.warn(TAG, '发送失败');
          return;
        }
        console.log(TAG, '发送成功, 建立 SSE 连接...');

        // 3. 创建 assistant 占位消息
        const assistantMsgId = `assistant_${Date.now()}`;
        appendToStore(sessionId, {
          id: assistantMsgId,
          sessionId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
          status: 'streaming',
        });

        // 4. 建立 SSE 连接，实时接收回复
        const currentMessageId = { current: assistantMsgId };
        const sseClient = new SseClient({
          url: `http://${host}/api/session/stream?id=${sessionId}`,
          token,
        });

        // 注册事件处理器
        const handleSseEvent = (event: any) => {
          sseEventToStoreAction(
            event,
            useMessageStore.getState(),
            sessionId,
            currentMessageId,
          );
        };

        // 注册所有 critical + coalescible 事件
        const criticalEvents = [
          'chat:message-chunk', 'chat:message-complete', 'chat:message-error',
          'chat:tool-use-start', 'chat:tool-result-delta', 'chat:tool-result-complete',
          'chat:thinking-start', 'chat:thinking-chunk', 'chat:message-stopped',
        ];
        criticalEvents.forEach(evt => sseClient.on(evt, handleSseEvent));

        sseClient.connect();

        // 存储以便卸载时断开
        sseClientRef.current = sseClient;

      } catch (err: any) {
        console.error(TAG, '发送失败:', err?.message);
      }
    } else {
      console.warn(TAG, '未连接, 消息仅保存在本地');
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题栏由 React Navigation 提供 */}

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={(w, h) => {
          if (filteredMessages.length === 0) return;

          const prevCount = messageCountRef.current;
          const newCount = filteredMessages.length;
          messageCountRef.current = newCount;

          if (!hasScrolledToBottom.current) {
            // 首次加载：等布局稳定后直接跳到底部（无动画）
            // 多次尝试确保生效
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
              hasScrolledToBottom.current = true;
            }, 50);
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 200);
          } else if (newCount > prevCount) {
            // 新消息到来：平滑滚动到底部
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 50);
          }
        }}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            {loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : (
              <Text style={styles.emptyText}>暂无消息，发送第一条消息吧</Text>
            )}
          </View>
        ) : (
          filteredMessages.map((msg) => {
            try {
              // 映射 ToolCall → ToolCallInfo（status→state, output→result）
              const msgTools: ToolCallInfo[] = (msg.toolCalls || []).map((tc: any) => ({
                name: tc.name || 'Unknown',
                input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input || {}),
                state: tc.status || 'completed',
                result: tc.output,
              }));

              if (msg.role === 'user') {
                return (
                  <View key={msg.id} testID="user-message" style={[styles.messageBubble, styles.userBubble]}>
                    <MarkdownRenderer content={msg.content} />
                  </View>
                );
              }

              // assistant 消息
              const hasToolsOrThinking = msgTools.length > 0 || msg.thinking;
              const isStreaming = msg.status === 'streaming';

              return (
                <View key={msg.id} testID="assistant-message" style={styles.assistantBubble}>
                  {msg.content ? (
                    isStreaming ? (
                      <StreamingMessageRenderer text={msg.content} isStreaming={true} />
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )
                  ) : null}
                  {hasToolsOrThinking && !msg.content && (
                    <Text style={{ fontSize: 13, color: '#968a7e', fontStyle: 'italic' }}>
                      🤔 思考中...
                    </Text>
                  )}
                  {msg.thinking ? (
                    <ThinkingBlock thinking={msg.thinking} />
                  ) : null}
                  {msgTools.map((tool: ToolCallInfo, i: number) => (
                    <ToolCallRow key={`tool-${i}`} tool={tool} />
                  ))}
                </View>
              );
            } catch (e) {
              return (
                <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={{ fontSize: 13, color: '#1c1612' }}>{msg.content.slice(0, 500)}</Text>
                </View>
              );
            }
          })
        )}
      </ScrollView>

      {/* 输入框 */}
      <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="输入消息..."
            placeholderTextColor="#968a7e"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            testID="send-button"
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>发送</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6ee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 22, 18, 0.10)',
  },
  backBtn: {
    fontSize: 15,
    color: '#c26d3a',
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1612',
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 15,
    color: '#968a7e',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  messageBubble: {
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 16,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingRight: 16,
  },
  thinkingBlock: {
    backgroundColor: 'rgba(28, 22, 18, 0.04)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#968a7e',
  },
  thinkingText: {
    fontSize: 13,
    color: '#6f6156',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#1c1612',
  },
  assistantText: {
    color: '#1c1612',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 22, 18, 0.10)',
    backgroundColor: '#fffcf7',
    minHeight: 56,
  },
  input: {
    flex: 1,
    backgroundColor: '#faf6ee',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1c1612',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#c26d3a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
