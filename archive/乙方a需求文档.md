# MyAgents 移动伴侣 App 需求文档 (PRD)

> **项目代号**：MyAgents Mobile Companion  
> **技术路线**：方案 C — Capacitor 壳 + Sidecar 远程连接  
> **核心目标**：在手机上获得与桌面端一致的 Markdown/HTML 渲染体验，解决 IM 机器人中消息可视化的痛点

---

## 一、背景与动机

### 1.1 现状问题

用户通过 IM 机器人（Telegram / 飞书 / 钉钉）在手机上使用 MyAgents，但存在以下痛点：

| 痛点 | 具体表现 |
|------|---------|
| **Markdown 渲染缺失** | 代码块、表格、LaTeX 公式在 IM 中显示为原始文本 |
| **富文档无法预览** | PDF/DOCX/PPTX 等附件在 IM 中无法查看 |
| **Mermaid 图表不可见** | 流程图、时序图等在 IM 中变成代码文本 |
| **工具调用不可视** | Bash 输出、文件编辑等工具结果在 IM 中丢失结构 |
| **消息片段化** | 长 AI 回复被 IM 平台截断或分段发送，阅读体验差 |

### 1.2 为什么不直接用 IM

MyAgents 桌面端的渲染能力非常强大（见 [Markdown.tsx](src/renderer/components/Markdown.tsx)、[richdoc/](src/renderer/components/richdoc)）：

- KaTeX 数学公式渲染
- Mermaid 图表渲染
- 语法高亮代码块 + 复制按钮
- PDF / DOCX / PPTX / XLSX 内嵌预览
- 工具调用结构化展示（[ToolUse.tsx](src/renderer/components/ToolUse.tsx)）
- Widget 沙箱渲染（[WidgetRenderer.tsx](src/renderer/components/tools/WidgetRenderer.tsx)）

这些能力 IM 平台根本无法提供。我们需要一个**移动端原生壳**，将这些渲染能力带到手机上。

---

## 二、产品定位

**MyAgents Mobile Companion 是一个「只读阅读器 + 轻量交互」应用，不是完整的移动端客户端。**

```
┌──────────────────────────────────────────────────────┐
│                    用户手机                            │
│                                                      │
│   ┌────────────┐         ┌──────────────────────┐    │
│   │  IM 机器人  │  摘要+   │  MyAgents Companion  │    │
│   │  (微信/钉钉) │  深度链接 │  (Capacitor App)     │    │
│   │            │ ──────► │                      │    │
│   │  ✗ 纯文本   │         │  ✓ 完整 Markdown     │    │
│   │  ✗ 无渲染   │         │  ✓ 代码高亮+图表     │    │
│   │  ✗ 截断    │         │  ✓ 富文档预览        │    │
│   └────────────┘         │  ✓ 工具调用可视化     │    │
│                          └──────────┬───────────┘    │
│                                     │ SSE/HTTP       │
└─────────────────────────────────────┼────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │     桌面端 MyAgents (Sidecar)       │
                    │     0.0.0.0:port / 内网穿透         │
                    └────────────────────────────────────┘
```

**核心原则：** 计算在桌面端 Sidecar 完成，移动端只负责渲染和轻量交互。

---

## 三、功能需求

### 3.1 P0 — 核心功能（MVP 必须）

#### FR-01 会话消息阅读器

- 通过深度链接或手动输入连接到桌面端 Sidecar
- 加载指定会话的完整消息历史
- 以桌面端同等质量渲染 Markdown 内容，包括：
  - GFM 表格、任务列表、删除线
  - 语法高亮代码块（含复制按钮）
  - KaTeX 行内/块级数学公式
  - Mermaid 流程图/时序图
  - 可折叠的 `<details>` 区块
- 流式接收 SSE 事件，实时显示 AI 回复（复用现有 SSE 协议，见 [sse.ts](src/server/sse.ts)）

#### FR-02 IM 深度链接跳转

- IM 机器人发送消息时附带深度链接，格式示例：

```
📋 AI 已回复（2 个代码块 · 1 个图表）
🔗 点击查看 → myagents://s/{session_id}?host=192.168.1.5:3210
```

- 点击链接 → 打开 Companion App → 自动连接 Sidecar → 加载对应会话
- 支持的 IM 平台：Telegram / 飞书 / 钉钉 / OpenClaw 渠道插件

#### FR-03 Sidecar 连接管理

- 局域网自动发现：mDNS / SSDP 扫描运行中的 MyAgents 实例
- 手动输入：IP + 端口 + 配对码
- 连接状态指示：已连接 / 连接中 / 断开
- 支持内网穿透地址（Cloudflare Tunnel / frp）

#### FR-04 工具调用可视化

渲染以下工具结果（对应 [tools/](src/renderer/components/tools) 目录）：

| 工具 | 渲染方式 |
|------|---------|
| Bash 命令 | 终端风格输出 + 折叠 |
| 文件读取/编辑 | 代码 diff 高亮 |
| Glob/Grep | 文件列表 + 搜索高亮 |
| WebFetch/WebSearch | 抓取摘要 + 链接 |
| 任务 Todo | 清单式渲染 |
| 图片生成 | 内嵌图片预览 |

### 3.2 P1 — 增强功能（第二版迭代）

#### FR-05 富文档预览

复用 [richdoc/](src/renderer/components/richdoc) 组件：

- PDF 内嵌查看器（PdfViewer）
- DOCX 文档预览（DocxViewer）
- PPTX 幻灯片预览（PptxViewer）
- XLSX 表格预览（SheetViewer）

#### FR-06 轻量交互

- 发送简单文本消息给 AI（不依赖终端/浏览器等桌面专属能力）
- 工具权限审批：在 App 内点击「允许/拒绝」（当前 IM 机器人通过卡片按钮实现，见 [reply_router.rs](src-tauri/src/im/reply_router.rs)）
- 会话切换：从 IM 对话跳转到 Companion 后，可在不同会话间切换

#### FR-07 消息操作

- 复制消息内容（Markdown / 纯文本）
- 分享消息到其他 App
- 下载附件到手机本地存储

#### FR-08 推送通知

- AI 回复完成时发送本地推送通知
- 权限审批请求推送
- 点击通知跳转到对应会话

### 3.3 P2 — 锦上添花

#### FR-09 Widget 沙箱渲染

- 支持 `<widget>` 标签的沙箱 HTML 渲染（见 [WidgetRenderer.tsx](src/renderer/components/tools/WidgetRenderer.tsx)）
- 需在移动端 WebView 沙箱中安全执行

#### FR-10 离线缓存

- 缓存最近 N 条会话消息到本地
- 断网时可查看历史消息（只读）

#### FR-11 多桌面实例管理

- 保存多个 Sidecar 连接配置
- 快速切换不同的桌面端实例

---

## 四、技术架构

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│  MyAgents Companion (Capacitor + React)                  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  React 渲染层 │  │  SSE 客户端   │  │  Capacitor   │  │
│  │  (复用桌面组件)│  │  (EventSource)│  │  Native 插件  │  │
│  │             │  │              │  │  - 推送通知    │  │
│  │  Markdown   │  │  流式接收     │  │  - 深度链接    │  │
│  │  CodeBlock  │  │  重连/心跳    │  │  - 剪贴板     │  │
│  │  Mermaid    │  │  优先级过滤   │  │  - 文件系统    │  │
│  │  KaTeX      │  │              │  │  - 安全区域    │  │
│  │  RichDoc    │  │              │  │  - 状态栏     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  │
│         │                │                              │
│         └───────┬────────┘                              │
│                 │ HTTP / SSE                            │
└─────────────────┼──────────────────────────────────────┘
                  │
    ┌─────────────▼──────────────────────────────────┐
    │  桌面端 Sidecar (Node.js / Hono)               │
    │                                                │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
    │  │  聊天 API  │  │  SSE 端点  │  │  IM Bot 适配器│ │
    │  │  /api/chat│  │  /api/sse │  │  (已有模块)   │ │
    │  └──────────┘  └──────────┘  └──────────────┘ │
    │                                                │
    │  绑定 0.0.0.0:port（需改造，当前为 127.0.0.1）    │
    └────────────────────────────────────────────────┘
```

### 4.2 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|---------|
| **原生壳** | Capacitor 6 | 轻量、Web 技术栈、深度链接/推送开箱即用 |
| **前端框架** | React + Vite | 与桌面端技术栈一致，组件可直接复用 |
| **Markdown 渲染** | 复用 [markdown/](src/renderer/components/markdown) | CodeBlock / MermaidDiagram / InlineCode 无 Tauri 依赖 |
| **富文档** | 复用 [richdoc/](src/renderer/components/richdoc) | PDF/DOCX/PPTX/XLSX Viewer 纯 Web 实现 |
| **SSE 客户端** | 原生 EventSource + fetch | 复用现有 SSE 协议（[sse.ts](src/server/sse.ts)） |
| **状态管理** | React Context + SWR | 轻量，无需引入桌面端完整状态树 |
| **样式** | Tailwind CSS + 移动端适配 | 复用桌面端设计令牌，增加移动断点 |
| **推送** | Capacitor Push + FCM/APNs | 标准移动推送方案 |
| **内网发现** | mDNS (bonjour) + HTTP 探测 | 零配置局域网发现 |

### 4.3 不使用 Tauri Mobile 的理由

虽然 MyAgents 桌面端基于 Tauri，但移动端选择 Capacitor：

| 维度 | Tauri Mobile | Capacitor |
|------|-------------|-----------|
| 与桌面端共享 Rust 代码 | ✅ | ❌ |
| 构建复杂度 | 高（需 Android NDK + Rust 交叉编译） | 低（纯 Web 构建） |
| 深度链接 | 需手写 Kotlin/Java | 插件开箱即用 |
| 推送通知 | 无官方插件 | 官方 Push 插件 |
| 社区生态 | 移动端尚不成熟 | 成熟，Ionic 体系 |
| 调试体验 | 复杂 | Chrome DevTools 直连 |

**核心判断：** Companion App 不需要 Rust 层能力（不运行 Sidecar、不操作 PTY、不管理进程），纯 Web + 原生桥接就够了。引入 Tauri 的 Rust 交叉编译成本没有回报。

---

## 五、桌面端 Sidecar 改造需求

Companion App 的前提是 Sidecar 能被移动端访问。以下是需要对桌面端做的最小改动：

### 5.1 SC-01 Sidecar 监听地址可配置

**当前状态：** Sidecar 绑定 `127.0.0.1`（仅本机可访问）

**改造：** 新增配置项 `sidecar.bindAddress`，支持以下值：

| 值 | 行为 |
|----|------|
| `localhost` (默认) | 绑定 127.0.0.1，仅本机访问（现有行为，零破坏） |
| `lan` | 绑定 0.0.0.0，局域网可访问 |
| 自定义 IP | 绑定指定地址 |

**安全措施：**
- 切换到非 localhost 时，必须设置配对码（6 位数字），移动端首次连接需验证
- Sidecar 启动时在日志中打印局域网 IP + 端口 + 配对码
- 配对码验证通过后签发 JWT Token，后续请求携带 Token

### 5.2 SC-02 IM 机器人消息格式增强

**当前状态：** IM 适配器（[reply_router.rs](src-tauri/src/im/reply_router.rs)）将 AI 回复原文直接发送到 IM

**改造：** 在 IM 消息末尾追加深度链接：

```
原始 IM 消息（截断到平台限制）
...
━━━━━━━━━━━━━
📊 含 2 个代码块 · 1 个 Mermaid 图表
🔗 点击查看完整渲染 → myagents://s/{session_id}?h={host}&t={token}
```

**配置项：** `imBot.deepLink.enabled`（默认关闭，用户主动开启）

### 5.3 SC-03 移动端专用 API 端点

新增少量 API，专为移动端 Companion 设计：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/mobile/pair` | POST | 配对码验证 → 返回 JWT |
| `/api/mobile/sessions` | GET | 列出可用会话（含摘要） |
| `/api/mobile/session/:id` | GET | 获取单个会话完整消息 |
| `/api/mobile/session/:id/stream` | GET (SSE) | 实时流式推送 |
| `/api/mobile/session/:id/send` | POST | 发送消息（FR-06 轻量交互） |
| `/api/mobile/approve/:request_id` | POST | 工具权限审批（FR-06） |

这些端点与现有桌面端 API 并行存在，不修改现有 API 行为。

---

## 六、移动端详细设计

### 6.1 页面结构

```
App
├── ConnectionScreen        // 连接管理（首次使用 / 切换实例）
│   ├── AutoDiscovery       // 局域网自动发现
│   ├── ManualInput         // 手动输入 IP + 端口 + 配对码
│   └── SavedConnections    // 已保存的连接列表
│
├── SessionListScreen       // 会话列表
│   ├── SearchBar           // 搜索会话
│   └── SessionCards        // 会话卡片（标题 + 摘要 + 时间）
│
└── ChatScreen              // 聊天阅读器（核心页面）
    ├── MessageList         // 消息列表（复用桌面端组件）
    │   ├── UserMessage     // 用户消息气泡
    │   ├── AssistantMessage // AI 回复（Markdown 渲染）
    │   └── ToolUseBlock    // 工具调用块
    ├── InputBar            // 轻量输入栏（FR-06）
    └── AttachmentPreview   // 附件预览（FR-05）
```

### 6.2 组件复用策略

从桌面端 `src/renderer/components/` 直接复用的组件：

| 组件 | 路径 | 复用方式 | 改动 |
|------|------|---------|------|
| Markdown | [Markdown.tsx](src/renderer/components/Markdown.tsx) | 直接复用 | 移除 Tauri 依赖（`openExternal` → `window.open`） |
| CodeBlock | [CodeBlock.tsx](src/renderer/components/markdown/CodeBlock.tsx) | 直接复用 | 无 |
| MermaidDiagram | [MermaidDiagram.tsx](src/renderer/components/markdown/MermaidDiagram.tsx) | 直接复用 | 无 |
| InlineCode | [InlineCode.tsx](src/renderer/components/markdown/InlineCode.tsx) | 直接复用 | 无 |
| ToolUse | [ToolUse.tsx](src/renderer/components/ToolUse.tsx) | 适配复用 | 移除 Tauri IPC 依赖 |
| RichDocViewer | [richdoc/RichDocViewer.tsx](src/renderer/components/richdoc/RichDocViewer.tsx) | 直接复用 | 无 |
| PdfViewer | [richdoc/PdfViewer.tsx](src/renderer/components/richdoc/PdfViewer.tsx) | 直接复用 | 无 |

**不复用的组件**（桌面专属，需简化替代）：

| 组件 | 原因 | 替代方案 |
|------|------|---------|
| TerminalPanel | 依赖 PTY | 不提供终端功能 |
| BrowserPanel | 依赖 Multi-Webview | 链接跳转系统浏览器 |
| CustomTitleBar | 桌面窗口管理 | 原生导航栏 |
| TabBar | 多 Tab 管理 | 单会话 + 返回列表 |

### 6.3 SSE 事件适配

移动端 SSE 客户端需处理的优先级事件（对应 [sse.ts](src/server/sse.ts) 中的 `SSE_EVENT_PRIORITIES`）：

```
必须处理（critical）：
  chat:message-chunk      → 流式追加文本
  chat:message-complete   → 消息完成，触发最终渲染
  chat:message-error      → 错误展示
  chat:thinking-start     → 思考中动画
  chat:tool-use-start     → 工具调用开始
  chat:tool-use-end       → 工具调用结果

可选处理（coalescible）：
  chat:thinking-chunk     → 思考过程流式展示
  chat:tool-input-delta   → 工具输入流式展示

忽略（droppable）：
  chat:log                → 不展示日志
  chat:debug-message      → 不展示调试信息
```

### 6.4 深度链接协议

```
myagents://s/{session_id}?h={host}&t={token}

参数：
  session_id  - 会话 ID（必需）
  host        - Sidecar 地址，格式 host:port（必需）
  token       - 配对验证 JWT（可选，已配对设备可省略）

示例：
  myagents://s/ses_abc123?h=192.168.1.5:3210&t=eyJ...
  myagents://s/ses_abc123?h=myagent-tunnel.example.com:443
```

### 6.5 安全设计

| 层面 | 措施 |
|------|------|
| **传输** | HTTPS 强制（局域网可用自签证书 + 证书指纹钉扎） |
| **认证** | 6 位配对码 → JWT Token，Token 有效期 7 天，过期需重新配对 |
| **CORS** | Sidecar 仅允许已配对设备的 Origin |
| **输入** | 用户消息长度限制 4000 字符，禁止注入式指令 |
| **渲染** | 复用 rehype-sanitize（[Markdown.tsx](src/renderer/components/Markdown.tsx) 已有） |

---

## 七、项目结构

```
myagents-companion/
├── capacitor.config.ts          // Capacitor 配置
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx                 // 入口
│   ├── App.tsx                  // 路由 + 状态
│   ├── screens/
│   │   ├── ConnectionScreen.tsx // 连接管理
│   │   ├── SessionListScreen.tsx// 会话列表
│   │   └── ChatScreen.tsx      // 聊天阅读器
│   ├── components/              // 从桌面端复用的组件
│   │   ├── markdown/           // Markdown 渲染（直接复用）
│   │   ├── richdoc/            // 富文档查看器（直接复用）
│   │   ├── tools/              // 工具调用展示（适配复用）
│   │   └── mobile/             // 移动端专属组件
│   │       ├── ConnectionCard.tsx
│   │       ├── SessionCard.tsx
│   │       ├── MobileInputBar.tsx
│   │       └── SwipeNavigator.tsx
│   ├── hooks/
│   │   ├── useSSE.ts           // SSE 连接管理
│   │   ├── useSidecar.ts       // Sidecar API 封装
│   │   └── useDeepLink.ts      // 深度链接处理
│   ├── services/
│   │   ├── sse-client.ts       // SSE 客户端（重连/心跳/优先级）
│   │   ├── sidecar-api.ts      // HTTP API 客户端
│   │   ├── discovery.ts        // 局域网发现
│   │   └── auth.ts             // 配对码 + JWT 管理
│   ├── utils/
│   │   ├── tauri-shim.ts       // 桌面端 Tauri API 的空实现/替代
│   │   └── platform.ts         // 平台检测（iOS/Android）
│   └── styles/
│       └── mobile.css          // 移动端适配样式
├── android/                    // Capacitor 生成的 Android 项目
├── ios/                        // Capacitor 生成的 iOS 项目
└── resources/                  // 图标 + 启动画面
```

---

## 八、开发里程碑

### Phase 1：MVP（4 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W1 | 项目脚手架 + 组件复用 | Capacitor 项目 + Markdown/CodeBlock/Mermaid 渲染可用 |
| W2 | SSE 客户端 + 连接管理 | 可连接 Sidecar + 流式显示 AI 回复 |
| W3 | Sidecar 改造（SC-01/02/03） | Sidecar 支持 0.0.0.0 绑定 + 配对码 + 移动端 API |
| W4 | 深度链接 + IM 集成 | IM 消息带深度链接 → 点击跳转 App |

**MVP 验收标准：** 在手机上通过 IM 深度链接打开 App，看到与桌面端一致的 Markdown 渲染效果。

### Phase 2：增强（3 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W5 | 轻量交互 | 发送消息 + 权限审批 |
| W6 | 富文档预览 + 推送通知 | PDF/DOCX 预览 + FCM/APNs 推送 |
| W7 | 局域网自动发现 + 内网穿透 | mDNS 发现 + Cloudflare Tunnel 支持 |

### Phase 3：打磨（2 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W8 | 离线缓存 + 性能优化 | 本地缓存 + 长列表虚拟滚动 |
| W9 | UI 打磨 + 多实例管理 | 多连接管理 + 主题适配 |

---

## 九、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Sidecar 暴露到局域网有安全风险 | 中 | 高 | 配对码 + JWT + HTTPS + CORS 白名单 |
| 移动端 WebView 性能不足（Mermaid/KaTeX） | 中 | 中 | 懒渲染 + 虚拟列表 + 降级方案（Mermaid→静态图） |
| IM 平台不支持深度链接 | 低 | 高 | 降级为复制链接手动打开 |
| iOS App Store 审核（WebView 类 App） | 中 | 中 | 确保有足够原生功能（推送、深度链接、剪贴板） |
| Capacitor 版本与桌面端 React 版本冲突 | 低 | 低 | 独立 package.json，仅复用组件源码 |

---

## 十、成功指标

| 指标 | 目标 |
|------|------|
| IM 消息点击率（深度链接） | ≥ 40% |
| App 首屏加载时间 | ≤ 2s（已配对设备） |
| Markdown 渲染与桌面端视觉一致性 | ≥ 95% |
| SSE 流式延迟（局域网） | ≤ 100ms（vs 桌面端） |
| Crash-free 率 | ≥ 99% |

---