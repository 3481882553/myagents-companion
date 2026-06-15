# MVP W8-9 Sidecar 改造 — 测试文档

> **阶段**：W8-9 Sidecar 改造  
> **目标**：在桌面端 Sidecar 中新增移动端 HTTP 服务和认证中间件  
> **测试框架**：Jest + Node.js

---

## 一、移动端 HTTP 服务测试

### 1.1 端口绑定

| 用例 | 操作 | 预期结果 |
|------|------|---------|
| 启动移动端服务 | `--mobile-port=32101` | 监听 0.0.0.0:32101 |
| 不启动移动端服务 | 不传 `--mobile-port` | 不监听额外端口 |
| 端口冲突 | 端口已被占用 | 启动失败，返回错误 |

### 1.2 路由白名单

| 用例 | 请求 | 预期结果 |
|------|------|---------|
| 白名单内端点 | GET `/api/session/list` | 200 |
| 白名单外端点 | GET `/api/admin/cron/list` | 404 |
| 配对端点 | POST `/api/pair` | 200 |

---

## 二、JWT 认证中间件测试

### 2.1 配对流程

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 正确配对码 | POST `/api/pair` { code: '123456' } | 200 + JWT Token |
| 错误配对码 | POST `/api/pair` { code: '000000' } | 403 |
| 空配对码 | POST `/api/pair` { code: '' } | 400 |

### 2.2 Token 验证

| 用例 | 请求 | 预期结果 |
|------|------|---------|
| 有效 Token | GET `/api/session/list` + Bearer token | 200 |
| 无 Token | GET `/api/session/list` | 401 |
| 无效 Token | GET `/api/session/list` + Bearer invalid | 401 |
| 过期 Token | GET `/api/session/list` + Bearer expired | 401 |

---

## 三、API 端点测试

### 3.1 会话 API

| 用例 | 端点 | 预期结果 |
|------|------|---------|
| 会话列表 | GET `/api/session/list` | 返回会话数组 |
| 会话消息 | GET `/api/session/messages?sessionId=xxx` | 返回消息数组 |
| 发送消息 | POST `/api/session/send` | 返回成功 |
| SSE 流 | GET `/api/session/stream` | 返回事件流 |

### 3.2 权限审批

| 用例 | 端点 | 预期结果 |
|------|------|---------|
| 允许审批 | POST `/api/permission/respond` | 返回成功 |
| 拒绝审批 | POST `/api/permission/respond` | 返回成功 |

### 3.3 日志查询

| 用例 | 端点 | 预期结果 |
|------|------|---------|
| 关键词搜索 | GET `/api/logs/export?keyword=error` | 返回匹配日志 |
| 时间范围 | GET `/api/logs/export?since=2026-01-01` | 返回指定时间后的日志 |

---

## 四、安全测试

| 用例 | 操作 | 预期结果 |
|------|------|---------|
| 未配对访问 | GET `/api/session/list` | 401 |
| 配对后访问 | POST pair + GET list | 200 |
| Token 续期 | Token 过期前 24h | 自动续期 |
| 设备撤销 | 撤销设备 Token | 401 |

---

**文档版本**：v1.0  
**创建日期**：2026-06-14
