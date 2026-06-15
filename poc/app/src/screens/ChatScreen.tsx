/**
 * ChatScreen — 聊天界面
 *
 * 功能：消息列表 + 输入框 + SSE 流式渲染
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { ToolCallRow, ToolCallInfo } from '../components/tools/ToolCallRow';
import { useConnectionStore } from '../store/connectionStore';
import { useMessageStore } from '../store/messageStore';
import type { Message } from '../types/message';

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
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const hasScrolledToBottom = useRef(false);
  const messageCountRef = useRef(0);

  const { host, token } = useConnectionStore();
  const { loadMessagesFromApi, sendMessage, loadMessages } = useMessageStore();

  useEffect(() => {
    console.log(TAG, '屏幕已挂载, sessionId:', sessionId, 'host:', host || '(未设置)');
    return () => console.log(TAG, '屏幕将卸载, sessionId:', sessionId);
  }, [sessionId]);

  // 过滤掉工具调用消息（content 为空或 system 消息）
  const filteredMessages = useMemo(() => {
    return displayMessages.filter(msg => {
      if (!msg.content || msg.content.trim() === '') return false;
      // 过滤 system 命令消息
      if (msg.content.startsWith('<command-name>') || msg.content.startsWith('<local-command-')) return false;
      return true;
    });
  }, [displayMessages]);

  // 加载消息
  useEffect(() => {
    if (!host) {
      setDisplayMessages([]);
      setLoading(false);
      return;
    }

    const loadMsgs = async () => {
      try {
        const msgs = await loadMessagesFromApi(sessionId, host, token || '');
        setDisplayMessages(msgs);
      } catch {
        // 静默失败
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

    // 立即显示用户消息
    setDisplayMessages(prev => [...prev, userMessage]);
    setInputText('');
    console.log(TAG, '用户消息已添加到本地:', userMessage.id);

    // 使用 messageStore 发送消息
    if (host && token) {
      try {
        console.log(TAG, '发送到 Sidecar...');
        await sendMessage(sessionId, text, host, token);
        console.log(TAG, '发送成功, 等待回复...');
        // 轮询获取最新消息
        setTimeout(async () => {
          try {
            const msgs = await loadMessagesFromApi(sessionId, host, token);
            console.log(TAG, '轮询获取到', msgs.length, '条消息');
            setDisplayMessages(msgs);
          } catch (err: any) {
            console.error(TAG, '轮询失败:', err?.message);
          }
        }, 3000);
      } catch (err: any) {
        console.error(TAG, '发送失败:', err?.message);
      }
    } else {
      console.warn(TAG, '未连接, 消息仅保存在本地');
    }

    // 消息已通过 store 发送
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
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        ) : (
          filteredMessages.map((msg) => {
            try {
              // 后端已返回结构化数据，直接使用
              const msgTools = (msg.toolCalls || []) as ToolCallInfo[];

              if (msg.role === 'user') {
                return (
                  <View key={msg.id} testID="user-message" style={[styles.messageBubble, styles.userBubble]}>
                    <MarkdownRenderer content={msg.content} />
                  </View>
                );
              }

              // assistant 消息
              return (
                <View key={msg.id} testID="assistant-message" style={styles.assistantBubble}>
                  {msg.content ? <MarkdownRenderer content={msg.content} /> : null}
                  {msgTools.length > 0 && !msg.content && (
                    <Text style={{ fontSize: 13, color: '#968a7e', fontStyle: 'italic' }}>
                      🤔 思考中...
                    </Text>
                  )}
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
