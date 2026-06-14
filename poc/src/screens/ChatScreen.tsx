/**
 * ChatScreen — 聊天界面
 *
 * 功能：消息列表 + 输入框 + SSE 流式渲染
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

interface ChatScreenProps {
  sessionId: string;
  host?: string;
  token?: string | null;
  messages?: Message[];
  onSend?: (message: string) => void;
  onBack?: () => void;
}

export function ChatScreen({ sessionId, host, token, messages = [], onSend, onBack }: ChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const [displayMessages, setDisplayMessages] = useState<Message[]>(messages);
  const [loading, setLoading] = useState(!!host);
  const scrollViewRef = useRef<any>(null);

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
      setDisplayMessages(messages);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`http://${host}/api/session/messages?sessionId=${sessionId}`, { headers });
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setDisplayMessages(data.messages);
        }
      } catch {
        // 静默失败
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, host, token, messages]);

  const handleSend = () => {
    if (!inputText.trim() || !onSend) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      createdAt: Date.now(),
    };

    setDisplayMessages(prev => [...prev, userMessage]);
    onSend(inputText.trim());
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>会话 {sessionId.slice(0, 8)}</Text>
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        ) : (
          filteredMessages.map((msg) => (
            <View
              key={msg.id}
              testID={msg.role === 'user' ? 'user-message' : 'assistant-message'}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === 'user' ? (
                <Text style={styles.userText}>{msg.content}</Text>
              ) : (
                <MarkdownRenderer content={msg.content} />
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 输入框 */}
      {onSend && (
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
      )}
    </KeyboardAvoidingView>
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
