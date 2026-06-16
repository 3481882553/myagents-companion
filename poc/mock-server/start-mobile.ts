/**
 * 独立 Mobile Server 启动脚本
 *
 * 用法（在新 cmd 窗口）：
 *   cd D:\myagents-android\poc\mock-server
 *   npm start
 *
 * 提供与源码 mobile-server.ts 一致的 API 端点，不依赖 MyAgents 桌面端。
 */

const PORT = parseInt(process.env.MYAGENTS_MOBILE_PORT || '32102');

// 内置配对码
const PAIR_CODE = '123456';
const JWT_SECRET = 'myagents-mobile-poc-secret-key-2026';

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

// ── JWT 简易实现 ──
function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  // PoC 简化：HMAC-SHA256 需要 Node crypto 模块
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string): boolean {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return false;
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    return sig === parts[2];
  } catch { return false; }
}

// ── Mock 数据 ──
const mockSessions = [
  {
    id: 'ses_demo_001',
    title: 'Demo: AI 代码审查',
    lastMessage: '已审查 3 个文件，发现 2 个潜在问题',
    lastMessageAt: Date.now() - 60000,
    messageCount: 24,
  },
  {
    id: 'ses_demo_002',
    title: 'Demo: 数据分析报告',
    lastMessage: '报告已生成，包含 5 个 Mermaid 图表',
    lastMessageAt: Date.now() - 300000,
    messageCount: 42,
  },
  {
    id: 'ses_demo_003',
    title: 'Demo: 定时任务配置',
    lastMessage: '已添加每日 9:00 的天气预报推送',
    lastMessageAt: Date.now() - 3600000,
    messageCount: 15,
  },
];

const mockMessages: Record<string, any[]> = {
  ses_demo_001: [
    { id: 'msg_001', role: 'user', content: '帮我审查一下 src/utils.ts', tools: [], createdAt: Date.now() - 120000 },
    {
      id: 'msg_002', role: 'assistant', content: '## 代码审查报告\n\n### 1. `src/utils.ts`\n\n```typescript\n// Line 45: 潜在的空指针\nconst data = user.getData();\n```\n\n**建议**: 添加 null 检查。\n\n### 2. `src/api.ts`\n\n| 严重度 | 文件 | 行号 | 问题 |\n|--------|------|------|------|\n| 🔴 高 | api.ts | 23 | 未处理 fetch error |\n| 🟡 中 | utils.ts | 45 | 潜在空指针 |',
      tools: [
        { name: 'Read', input: '{"file":"src/utils.ts"}' },
        { name: 'Grep', input: '{"pattern":"getData"}' },
      ],
      createdAt: Date.now() - 60000,
    },
  ],
};

// ── HTTP Server ──
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 健康检查
  if (pathname === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mobile: PORT }));
    return;
  }

  // 配对
  if (pathname === '/api/pair' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.code === PAIR_CODE) {
      const token = signToken({ pairedAt: Date.now() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, token }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '配对码错误' }));
    }
    return;
  }

  // JWT 验证（/api/pair 除外）
  if (pathname !== '/api/pair' && pathname !== '/health/live') {
    const auth = req.headers.authorization || '';
    if (!verifyToken(auth)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }

  // 会话列表
  if (pathname === '/api/session/list' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions: mockSessions }));
    return;
  }

  // 会话消息
  if (pathname === '/api/session/messages' && req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId') || '';
    const msgs = mockMessages[sessionId] || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ messages: msgs }));
    return;
  }

  // 发送消息
  if (pathname === '/api/session/send' && req.method === 'POST') {
    const body = await readBody(req);
    console.log('[mock-server] 收到消息:', body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, queued: true }));
    // 模拟 3 秒后 SSE 推送回复
    setTimeout(() => {
      console.log('[mock-server] 模拟 AI 回复完成（可在 SSE 端点查看）');
    }, 3000);
    return;
  }

  // SSE 流
  if (pathname === '/api/session/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    try {
      // 发送 system-init
      sendSSE(res, 'chat:system-init', { status: 'ready' });

      // 模拟流式消息（不 await，用 setTimeout 实现）
      const demoText = '这是一个 **Mock Server** 的演示回复。\n\n```javascript\nconst greeting = "Hello from Mock Server!";\nconsole.log(greeting);\n```\n\n支持 **Markdown** 和代码高亮！';
      const chunks = demoText.split(' ');

      let i = 0;
      const sendChunk = () => {
        if (i >= chunks.length) {
          sendSSE(res, 'chat:message-complete', {});
          return;
        }
        if (res.writableEnded) return;
        sendSSE(res, 'chat:message-chunk', { text: chunks[i] + ' ' });
        i++;
        setTimeout(sendChunk, 80);
      };
      setTimeout(sendChunk, 200);

      req.on('close', () => {
        console.log('[mock-server] SSE client disconnected');
      });
    } catch (err: any) {
      console.error('[mock-server] SSE error:', err.message);
      if (!res.writableEnded) {
        res.end();
      }
    }
    return;
  }

  // 权限审批
  if (pathname === '/api/permission/respond' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

function sendSSE(res: ServerResponse, event: string, data: any) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-server] Mobile API listening on http://0.0.0.0:${PORT}`);
  console.log(`[mock-server] Endpoints:`);
  console.log(`  POST /api/pair            — 配对码: ${PAIR_CODE}`);
  console.log(`  GET  /api/session/list     — 会话列表`);
  console.log(`  GET  /api/session/messages — 会话消息`);
  console.log(`  POST /api/session/send     — 发送消息`);
  console.log(`  GET  /api/session/stream   — SSE 流式推送`);
  console.log(`[mock-server] Connect from emulator: 10.0.2.2:${PORT}`);
});
