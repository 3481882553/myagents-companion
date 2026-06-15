# MVP W4 通信层 — 测试文档

> **阶段**：W4 通信层基础  
> **目标**：验证 HTTP API 客户端 + SSE 客户端 + EventCoalescer + 状态管理  
> **测试框架**：Jest + TypeScript

---

## 一、SidecarHttpApi 测试

### 1.1 基础请求

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| GET 请求 | `api.get('/api/session/list')` | 返回 JSON 数据 |
| POST 请求 | `api.post('/api/session/send', { message: 'test' })` | 返回成功响应 |
| 自动携带 Token | 已设置 Token 时发请求 | Header 包含 `Authorization: Bearer <token>` |
| 无 Token 请求 | 未设置 Token 时发请求 | Header 不包含 Authorization |

### 1.2 错误处理

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 401 未授权 | 服务端返回 401 | 抛出 `UnauthorizedError` |
| 403 禁止 | 服务端返回 403 | 抛出 `ForbiddenError` |
| 404 未找到 | 服务端返回 404 | 抛出 `NotFoundError` |
| 500 服务器错误 | 服务端返回 500 | 抛出 `ServerError` |
| 网络错误 | 网络断开 | 抛出 `NetworkError` |
| 超时 | 请求超时 | 抛出 `TimeoutError` |

### 1.3 Token 管理

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 设置 Token | `api.setToken('test-token')` | 后续请求携带该 Token |
| 清除 Token | `api.clearToken()` | 后续请求不携带 Token |
| Token 过期检测 | 服务端返回 401 | 触发 Token 过期回调 |

---

## 二、SseClient 测试

### 2.1 连接状态机

| 用例 | 操作 | 预期状态 |
|------|------|---------|
| 初始状态 | 创建 SseClient | DISCONNECTED |
| 连接 | 调用 connect() | CONNECTING |
| 连接成功 | 服务端返回 200 | CONNECTED |
| 连接失败 | 服务端返回错误 | RETRYING |
| 断开连接 | 调用 disconnect() | DISCONNECTED |
| 重连成功 | RETRYING 后连接成功 | CONNECTED |
| 超过最大重试 | 连续失败超过 10 次 | DISCONNECTED |

### 2.2 事件接收

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 接收 critical 事件 | `chat:message-complete` | 立即触发回调 |
| 接收 coalescible 事件 | `chat:message-chunk` | 40ms 窗口内合并后触发 |
| 接收 droppable 事件 | `chat:log` | 不触发回调 |
| 接收未知事件 | `unknown:event` | 默认为 critical，触发回调 |
| JSON 事件解析 | `{"type":"chat:init","data":"{}"}` | data 解析为对象 |
| STRING 事件解析 | `{"type":"chat:message-chunk","data":"Hello"}` | data 保持字符串 |

### 2.3 重连机制

| 用例 | 操作 | 预期结果 |
|------|------|---------|
| 指数退避 | 连续失败 | 500ms → 1s → 2s → 4s → 8s → 16s → 30s |
| 退避上限 | 延迟超过 30s | 保持 30s |
| 重连成功后重置 | 成功连接后再次断开 | 从 500ms 重新开始 |
| 手动重连 | 调用 reconnect() | 重置退避并尝试连接 |

---

## 三、EventCoalescer 测试

### 3.1 合并逻辑

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 单个事件 | 1 个 `chat:message-chunk` | 40ms 后触发，数据不变 |
| 多个同类型事件 | 3 个 `chat:message-chunk` 在 40ms 内 | 合并为 1 个，text 拼接 |
| 不同类型事件 | `chat:message-chunk` + `chat:thinking-chunk` | 各自独立合并 |
| 跨窗口事件 | 第 1 个事件后 50ms 再发第 2 个 | 分别触发，不合并 |

### 3.2 Delta 拼接

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| text 拼接 | `["Hello", " World"]` | `"Hello World"` |
| 空 text | `["", "World"]` | `"World"` |
| 大量 delta | 100 个 delta 事件 | 正确拼接为完整文本 |

---

## 四、状态管理测试

### 4.1 connectionStore

| 用例 | 操作 | 预期状态 |
|------|------|---------|
| 初始状态 | 创建 store | `{ status: 'disconnected', token: null, host: null }` |
| 设置连接 | `setConnection('192.168.1.5:32101')` | `{ host: '192.168.1.5:32101' }` |
| 设置 Token | `setToken('test-token')` | `{ token: 'test-token' }` |
| 断开连接 | `disconnect()` | `{ status: 'disconnected', token: null }` |

### 4.2 sessionStore

| 用例 | 操作 | 预期状态 |
|------|------|---------|
| 初始状态 | 创建 store | `{ sessions: [], currentSession: null }` |
| 加载会话列表 | `loadSessions()` | `{ sessions: [...], currentSession: null }` |
| 选择会话 | `selectSession('ses-001')` | `{ currentSession: 'ses-001' }` |
| 追加消息 | `appendMessage('ses-001', msg)` | 对应会话的消息列表增加 |

### 4.3 messageStore

| 用例 | 操作 | 预期状态 |
|------|------|---------|
| 初始状态 | 创建 store | `{ messages: {}, streaming: {} }` |
| 开始流式消息 | `startStreaming('msg-001')` | `{ streaming: { 'msg-001': '' } }` |
| 追加 chunk | `appendChunk('msg-001', 'Hello')` | `{ streaming: { 'msg-001': 'Hello' } }` |
| 完成流式 | `completeStreaming('msg-001')` | 消息从 streaming 移到 messages |
| 加载历史消息 | `loadMessages('ses-001', [...])` | 对应会话有消息 |

---

## 五、集成测试

### 5.1 Mock Server + SSE 客户端

| 用例 | 操作 | 预期结果 |
|------|------|---------|
| 连接 Mock Server | `api.get('/health/live')` | 返回 200 |
| 配对 | `api.post('/api/pair', { code: '123456' })` | 返回 JWT Token |
| 认证请求 | `api.get('/api/session/list')` | 返回会话列表 |
| SSE 流 | 连接 `/api/session/stream` | 收到 10 个事件（500ms 间隔） |
| 发送消息 | `api.post('/api/session/send', {...})` | 返回成功 |

### 5.2 端到端流程

| 用例 | 操作 | 预期结果 |
|------|------|---------|
| 完整流程 | 配对 → 连接 → 加载会话 → 接收消息 | 全链路打通 |
| 重连流程 | 连接 → 断开 → 自动重连 → 恢复 | 状态正确恢复 |
| Token 过期 | Token 过期后请求 | 触发重新配对 |

---

**文档版本**：v1.0  
**创建日期**：2026-06-14
