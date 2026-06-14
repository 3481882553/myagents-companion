/**
 * HelperScreen — 内置小助理
 *
 * 两个核心能力：
 * 1. 连接客户端 — 诊断桌面端问题（读日志、查状态、执行 skill）
 * 2. 手机端自诊断 — 查日志、检查连接、生成诊断报告、提交 GitHub Issue
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';

interface HelperMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface HelperScreenProps {
  host?: string;
  token?: string | null;
  onBack?: () => void;
}

const QUICK_ACTIONS = [
  { id: 'status', label: '🔍 系统状态', prompt: '查询当前系统状态，包括 Provider、MCP 服务器、连接状态' },
  { id: 'logs', label: '📋 查看日志', prompt: '查看最近的错误日志和警告' },
  { id: 'diagnose', label: '🩺 诊断问题', prompt: '帮我诊断当前的问题，检查连接、配置、日志' },
  { id: 'issue', label: '🐛 提交 Issue', prompt: '我想提交一个 GitHub Issue，请帮我收集信息并创建' },
  { id: 'help', label: '❓ 使用帮助', prompt: '介绍一下你能做什么，怎么使用' },
];

export function HelperScreen({ host, token, onBack }: HelperScreenProps) {
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // 初始欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 你好！我是 MyAgents 小助理。\n\n我可以帮你：\n- 🔍 **查询系统状态** — Provider、MCP、连接状态\n- 📋 **查看日志** — 检查错误和警告\n- 🩺 **诊断问题** — 自动排查连接/配置问题\n- 🐛 **提交 Issue** — 到 GitHub\n- ❓ **使用帮助** — 回答 MyAgents 相关问题\n\n请告诉我你需要什么帮助，或者点击下方快捷操作。',
        timestamp: Date.now(),
      }]);
    }
  }, []);

  const handleSend = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || loading) return;

    // 添加用户消息
    const userMsg: HelperMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // 滚动到底部
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // 调用 Sidecar 发送消息（小助理会话）
    if (host && token) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // 获取会话列表
        const sessionRes = await fetch(`http://${host}/api/session/list`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const { sessions } = await sessionRes.json();
        clearTimeout(timeoutId);

        // 找到小助理会话（标题包含"小助理"或"Helper"）
        // 或者用最近的会话
        let helperSession = sessions?.find((s: any) =>
          s.title?.includes('小助理') || s.title?.includes('Helper') || s.title?.includes('helper')
        ) || sessions?.sort((a: any, b: any) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))?.[0];

        if (!helperSession) {
          setMessages(prev => [...prev, {
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: '⚠️ 没有可用的会话。请先在桌面端创建一个会话。',
            timestamp: Date.now(),
          }]);
          setLoading(false);
          return;
        }

        // 发送消息
        await fetch(`http://${host}/api/session/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId: helperSession.id, message: msg }),
        });

        // 等待回复（轮询）
        let retryCount = 0;
        const maxRetries = 5;
        const pollReply = async () => {
          if (retryCount >= maxRetries) {
            setLoading(false);
            return;
          }
          retryCount++;
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 8000);
            const res = await fetch(`http://${host}/api/session/messages?sessionId=${helperSession.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: ctrl.signal,
            });
            clearTimeout(tid);
            const data = await res.json();

            // 获取最后一条 assistant 消息
            const assistantMsgs = data.messages?.filter((m: any) => m.role === 'assistant') || [];
            const lastReply = assistantMsgs[assistantMsgs.length - 1];

            if (lastReply?.content && lastReply.content.length > 10) {
              setMessages(prev => [...prev, {
                id: `reply_${Date.now()}`,
                role: 'assistant',
                content: lastReply.content,
                timestamp: Date.now(),
              }]);
              setLoading(false);
            } else {
              setTimeout(pollReply, 2000);
            }
          } catch {
            setTimeout(pollReply, 2000);
          }
        };
        setTimeout(pollReply, 2000);
      } catch {
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: '⚠️ 连接失败，请检查网络连接和 Sidecar 状态。',
          timestamp: Date.now(),
        }]);
        setLoading(false);
      }
    } else {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ 请先连接到 Sidecar（返回首页 → 连接桌面端）。',
        timestamp: Date.now(),
      }]);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🤖 小助理</Text>
        {host && <Text style={styles.connected}>已连接</Text>}
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
          >
            {msg.role === 'assistant' ? (
              <MarkdownRenderer content={msg.content} />
            ) : (
              <Text style={styles.userText}>{msg.content}</Text>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.loadingText}>🤔 思考中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 快捷操作 */}
      {messages.length <= 1 && (
        <ScrollView horizontal style={styles.quickActions} showsHorizontalScrollIndicator={false}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickBtn}
              onPress={() => handleSend(action.prompt)}
            >
              <Text style={styles.quickBtnText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 输入框 */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="输入问题..."
          placeholderTextColor="#968a7e"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          editable={!loading}
          multiline
          maxLength={4000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
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
    backgroundColor: '#fffcf7',
  },
  backBtn: {
    fontSize: 15,
    color: '#c26d3a',
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1612',
    flex: 1,
  },
  connected: {
    fontSize: 12,
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
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
  bubble: {
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1c1612',
  },
  loadingText: {
    fontSize: 14,
    color: '#968a7e',
    fontStyle: 'italic',
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 50,
  },
  quickBtn: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: 'rgba(28, 22, 18, 0.10)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickBtnText: {
    fontSize: 13,
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
