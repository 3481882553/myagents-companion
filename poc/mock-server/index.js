/**
 * PoC Mock Server
 *
 * 模拟 Sidecar API，用于验证移动端通信协议。
 * 不修改桌面端源码，零风险。
 *
 * 运行：node poc/mock-server/index.js
 * 端口：32101（与 Sidecar 默认 31415 区分）
 */

const http = require('http');

const PORT = 32101;
const JWT_SECRET = 'poc-secret-key-only-for-testing';

// ========== 简易 JWT 实现（PoC 用，生产环境用 jose） ==========

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

function createToken(payload, expiresInSec) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  // PoC: 不做真实签名，仅验证协议格式
  const signature = base64url('poc-signature');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// ========== Mock 数据 ==========

const MOCK_SESSIONS = [
  { id: 'ses_001', title: '代码审查助手', lastMessageAt: Date.now() - 300000, messageCount: 42 },
  { id: 'ses_002', title: '文档生成器', lastMessageAt: Date.now() - 3600000, messageCount: 18 },
  { id: 'ses_003', title: '调试助手', lastMessageAt: Date.now() - 86400000, messageCount: 156 },
  { id: 'ses_004', title: '小助理', lastMessageAt: Date.now() - 60000, messageCount: 8, internal: true },
];

const MOCK_MESSAGES = {
  ses_001: [
    { id: 'msg_001', role: 'user', content: '帮我检查一下 src/app.ts 的代码质量', createdAt: Date.now() - 600000 },
    { id: 'msg_002', role: 'assistant', content: '好的，我来检查一下。\n\n```typescript\n// src/app.ts\nexport function main() {\n  // 这里有一个潜在的内存泄漏\n  setInterval(() => {\n    console.log("tick");\n  }, 1000);\n}\n```\n\n**问题**：`setInterval` 没有清理，会导致内存泄漏。\n\n**建议**：返回 cleanup 函数或使用 `AbortController`。', createdAt: Date.now() - 500000 },
    { id: 'msg_003', role: 'user', content: '谢谢，还有其他问题吗？', createdAt: Date.now() - 400000 },
    { id: 'msg_004', role: 'assistant', content: '还有几个小问题：\n\n| 问题 | 严重度 | 行号 |\n|------|--------|------|\n| 未处理的 Promise rejection | 高 | L15 |\n| 魔法数字 | 低 | L23 |\n| 缺少类型注解 | 低 | L8 |\n\n建议优先处理 Promise rejection 问题。', createdAt: Date.now() - 300000 },
  ],
};

// ========== SSE 事件生成 ==========

function generateSSEStream(sessionId) {
  const events = [
    { type: 'chat:system-init', data: JSON.stringify({ status: 'ready', sessionId }) },
    { type: 'chat:status', data: JSON.stringify({ status: 'running' }) },
    { type: 'chat:thinking-start', data: '{}' },
    { type: 'chat:thinking-chunk', data: '让我思考一下...' },
    { type: 'chat:content-block-stop', data: '{}' },
    { type: 'chat:message-chunk', data: '你好！' },
    { type: 'chat:message-chunk', data: ' 我是 AI 助手，' },
    { type: 'chat:message-chunk', data: '很高兴为你服务。' },
    { type: 'chat:message-complete', data: JSON.stringify({ id: 'msg_new', content: '你好！ 我是 AI 助手，很高兴为你服务。' }) },
    { type: 'chat:status', data: JSON.stringify({ status: 'idle' }) },
  ];
  return events;
}

// ========== 认证中间件 ==========

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return verifyToken(authHeader.slice(7));
}

// ========== HTTP 服务器 ==========

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // CORS（PoC 用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

  // ===== 配对端点（无需认证） =====
  if (path === '/api/pair' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { code } = JSON.parse(body);
        if (code === '123456') {
          const token = createToken({ paired: true, device: 'Android PoC' }, 7 * 24 * 3600);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ token, expiresIn: 7 * 24 * 3600 }));
        } else {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid pair code' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // ===== 健康检查（无需认证） =====
  if (path === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // ===== 以下端点需要认证 =====
  const user = authMiddleware(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // 会话列表
  if (path === '/api/session/list' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions: MOCK_SESSIONS }));
    return;
  }

  // 会话消息
  if (path === '/api/session/messages' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId') || 'ses_001';
    const messages = MOCK_MESSAGES[sessionId] || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessionId, messages }));
    return;
  }

  // 发送消息
  if (path === '/api/session/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId, message } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: `msg_${Date.now()}` }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // SSE 流
  if (path === '/api/session/stream' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId') || 'ses_001';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const events = generateSSEStream(sessionId);
    let i = 0;

    const interval = setInterval(() => {
      if (i >= events.length) {
        clearInterval(interval);
        res.end();
        return;
      }
      const event = events[i];
      res.write(`event: ${event.type}\ndata: ${event.data}\n\n`);
      i++;
    }, 500); // 每 500ms 发送一个事件

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Mock Server 启动`);
  console.log(`   地址: http://0.0.0.0:${PORT}`);
  console.log(`   配对码: 123456`);
  console.log(`\n   端点:`);
  console.log(`   POST /api/pair           — 配对码验证`);
  console.log(`   GET  /health/live        — 健康检查`);
  console.log(`   GET  /api/session/list   — 会话列表（需 Token）`);
  console.log(`   GET  /api/session/messages — 消息（需 Token）`);
  console.log(`   POST /api/session/send   — 发送消息（需 Token）`);
  console.log(`   GET  /api/session/stream — SSE 流（需 Token）`);
  console.log(`\n   测试命令:`);
  console.log(`   curl http://localhost:${PORT}/health/live`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/pair -H "Content-Type: application/json" -d '{"code":"123456"}'`);
});
