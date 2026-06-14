# Changelog

All notable changes to MyAgents Mobile Companion will be documented in this file.

## [0.1.0] - 2026-06-14

### Added

#### 核心功能
- **W4-W5**: 通信层 + 认证/连接管理
  - React Native 项目初始化
  - HTTP 客户端（fetch wrapper）
  - SSE 客户端（状态机 + 指数退避）
  - JWT 认证（配对码 123456）
  - 连接管理器（指数退避重连）

- **W6**: Markdown 渲染（简化版）
  - MarkdownRenderer 组件（逐行解析）
  - CodeBlock 组件（monospace + 复制）
  - MessageRenderer 组件（用户/AI/系统消息）
  - 暖色主题 Token（Light/Dark）

- **W8-9**: Sidecar 对接 + 消息加载
  - 对接 Sidecar HTTP API（/api/session/list, /api/session/messages）
  - SessionListScreen：真实会话列表
  - ChatScreen：消息加载 + 渲染
  - 移动端 HTTP 服务（mobile-server.ts）
  - JWT 认证中间件
  - 白名单路由

- **W10**: 消息发送 + 连接历史
  - 消息发送对接 /api/session/send
  - 会话切换（switchToSession）
  - 连接历史记录（内存存储）
  - 自动滚动到底部
  - 会话列表按 lastMessageAt 倒序

- **W6+**: 消息渲染升级
  - Markdown 渲染（手写版，支持标题/列表/引用/代码块）
  - ToolCallRow 组件（工具调用折叠行）
  - parseAssistantContent 解析 ContentBlock 数组
  - 后端结构化数据（text + tools）
  - extractText 递归深度限制（最大 5 层）
  - fetch 超时处理（AbortController + 10s）
  - JSONL 文件大小限制（5MB）
  - SSE 流 cleanup 函数
  - 会话列表过滤（internal / cronTaskId / .myagents）

- **W11**: 小助理 MVP
  - HelperScreen（小助理专属页面）
  - 快捷操作（系统状态/日志/诊断/Issue/帮助）
  - 会话管理（自动查找/最近会话 fallback）
  - 消息发送 + 轮询回复

#### 测试
- 129 个单元测试通过（30 个测试套件）
- 覆盖：通信层、会话管理、Sidecar API、工具调用、Markdown、小助理

#### 文档
- v3.0 需求文档、概要设计、详细设计、MVP 执行计划、测试方案
- README.md
- LICENSE (MIT)

### Changed
- 默认端口改为 32107（移动端实际端口）
- 会话列表过滤 internal 会话（agentDir 精确匹配 ~/.myagents）
- 消息显示限制为最近 50 条（性能优化）

### Fixed
- extractText 递归深度限制（防止栈溢出）
- fetch 请求超时处理（防止无限等待）
- JSONL 大小限制（防止内存溢出）
- SSE 流 cleanup（防止内存泄漏）
- 会话列表过滤误匹配（精确匹配 ~/.myagents）

## [0.1.0-alpha] - 2026-06-13

### Added
- Phase 0 PoC 完成
  - KaTeX 公式渲染验证
  - Mermaid 图表渲染验证
  - BashTool 终端输出验证
  - Mock Server 通信验证
