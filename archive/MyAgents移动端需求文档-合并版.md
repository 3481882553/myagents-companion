# MyAgents 移动端需求文档（合并版）

> **项目代号**：MyAgents Mobile Companion  
> **技术路线**：React Native + HTTP/SSE 直连 Sidecar  
> **核心目标**：在手机上获得与桌面端一致的 Markdown/HTML 渲染体验，解决 IM 机器人中消息可视化的痛点  
> **文档说明**：本文档综合了乙方 A（Capacitor 方案）和乙方 B（Jetpack Compose 方案）的需求，取长补短形成最优方案  
> **源码验证**：已通过 `D:\MyAgents-source` 源码验证，修正了组件复用率和工期估算（见 §3.3 和 §七）  
> **v2.4 更新**：修正逻辑层复用率（60-70%→30-40%）、Sidecar 改造复杂度、文件路径引用、SSE 事件遗漏、WidgetRenderer 安全模型

---

## 一、项目背景与定位

> **v2.0 更新说明**：本文档基于 `D:\MyAgents-source` 源码验证，修正了 v1.0 中的核心假设：
> 1. 组件复用率从"70%+"修正为"渲染层 10-20%，逻辑层 60-70%"
> 2. 工期从"9 周"修正为"15-17 周"（含 2 周 PoC）
> 3. 性能指标根据 WebView 渲染方案调整
> 4. 新增 Phase 0 PoC 验证阶段

### 1.1 现状问题

用户通过 IM 机器人（Telegram / 飞书 / 钉钉）在手机上使用 MyAgents，但存在以下痛点：

| 痛点 | 具体表现 |
|------|---------|
| **Markdown 渲染缺失** | 代码块、表格、LaTeX 公式在 IM 中显示为原始文本 |
| **富文档无法预览** | PDF/DOCX/PPTX 等附件在 IM 中无法查看 |
| **Mermaid 图表不可见** | 流程图、时序图等在 IM 中变成代码文本 |
| **工具调用不可视** | Bash 输出、文件编辑等工具结果在 IM 中丢失结构 |
| **消息片段化** | 长 AI 回复被 IM 平台截断或分段发送，阅读体验差 |

### 1.2 产品定位

**MyAgents Mobile Companion 是一个「只读阅读器 + 轻量交互」应用，不是完整的移动端客户端。**

```
┌──────────────────────────────────────────────────────┐
│                    用户手机                            │
│                                                      │
│   ┌────────────┐         ┌──────────────────────┐    │
│   │  IM 机器人  │  摘要+   │  MyAgents Companion  │    │
│   │  (微信/钉钉) │  深度链接 │  (React Native App)  │    │
│   │            │ ──────► │                      │    │
│   │  ✗ 纯文本   │         │  ✓ 完整 Markdown     │    │
│   │  ✗ 无渲染   │         │  ✓ 代码高亮+图表     │    │
│   │  ✗ 截断    │         │  ✓ 富文档预览        │    │
│   └────────────┘         │  ✓ 工具调用可视化     │    │
│                          └──────────┬───────────┘    │
│                                     │ HTTP/SSE       │
└─────────────────────────────────────┼────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │     桌面端 MyAgents (Sidecar)       │
                    │     0.0.0.0:port / 内网穿透         │
                    └────────────────────────────────────┘
```

**核心原则：** 计算在桌面端 Sidecar 完成，移动端只负责渲染和轻量交互。

### 1.3 为什么选择 React Native 而非其他方案

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| **Capacitor** | 开发快、Web 技术栈 | 性能差、启动慢、滚动卡顿 | ❌ 性能不达标 |
| **Jetpack Compose** | 性能好、原生体验 | 需重写所有渲染逻辑、开发周期长 | ❌ 成本太高 |
| **React Native** | 跨平台、性能好、复用逻辑层代码 | 渲染层需重写（WebView 方案） | ✅ 最优平衡 |

**核心判断**：React Native 可以复用 60-70% 的桌面端逻辑层代码（SSE 协议、Sidecar API、tools/ 组件），但渲染层（Markdown/Mermaid/KaTeX/PDF）需重写。相比 Capacitor 性能更好，相比 Jetpack Compose 开发更快。

---

## 二、功能需求

### 2.1 P0 — 核心功能（MVP 必须，4 周）

#### FR-01 会话消息阅读器

- 通过深度链接或手动输入连接到桌面端 Sidecar
- 加载指定会话的完整消息历史
- 以桌面端同等质量渲染 Markdown 内容，包括：
  - GFM 表格、任务列表、删除线
  - 语法高亮代码块（含复制按钮）
  - KaTeX 行内/块级数学公式
  - Mermaid 流程图/时序图
  - 可折叠的 `<details>` 区块
- 流式接收 SSE 事件，实时显示 AI 回复（复用现有 SSE 协议）

#### FR-02 IM 深度链接跳转

- IM 机器人发送消息时附带深度链接，格式示例：

```
📋 AI 已回复（2 个代码块 · 1 个图表）
🔗 点击查看 → myagents://s/{session_id}?host=192.168.1.5:3210
📷 扫码连接：[二维码图片]
```

- 点击链接 → 打开 Companion App → 自动连接 Sidecar → 加载对应会话
- 支持的 IM 平台：Telegram / 飞书 / 钉钉 / OpenClaw 渠道插件

#### FR-03 Sidecar 连接管理

- **二维码扫描**：桌面端显示二维码，手机扫码自动连接（推荐方式）
- **手动输入**：IP + 端口 + 配对码
- **连接状态指示**：已连接 / 连接中 / 断开 / 重连中
- **自动重连**：断网后自动尝试重连，指数退避策略
- 支持内网穿透地址（Cloudflare Tunnel / frp）

#### FR-04 工具调用可视化

渲染以下工具结果（对应桌面端 `src/renderer/components/tools/` 目录）：

| 工具 | 渲染方式 |
|------|---------|
| Bash 命令 | 终端风格输出 + 折叠 |
| 文件读取/编辑 | 代码 diff 高亮 |
| Glob/Grep | 文件列表 + 搜索高亮 |
| WebFetch/WebSearch | 抓取摘要 + 链接 |
| 任务 Todo | 清单式渲染 |
| 图片生成 | 内嵌图片预览 |

#### FR-05 流式消息接收

- 逐字/逐块渲染，打字机效果
- 支持 SSE 优先级事件处理：
  - **critical**（必须处理）：`chat:message-chunk`, `chat:message-complete`, `chat:message-error`
  - **coalescible**（可合并）：`chat:thinking-chunk`, `chat:tool-input-delta`
  - **droppable**（可丢弃）：`chat:log`, `chat:debug-message`
- 支持 40ms 时间窗口的 chunk 合并（减少渲染开销）

### 2.2 P1 — 增强功能（第二版迭代，3 周）

#### FR-06 轻量交互

- 发送简单文本消息给 AI（不依赖终端/浏览器等桌面专属能力）
- 工具权限审批：在 App 内点击「允许/拒绝」
- 会话切换：从 IM 对话跳转到 Companion 后，可在不同会话间切换
- 输入框工具栏：快速插入代码块、公式

#### FR-07 会话管理

- 多会话列表展示，支持搜索、置顶
- 会话创建（从模板/角色卡创建）
- 会话分组/标签（工作区、个人、临时）
- 会话持久化状态同步（断网重连后自动恢复）

#### FR-08 富文档预览

> ⚠️ **源码验证**：桌面端 richdoc/ 组件深度绑定 DOM，必须重写。

- PDF 内嵌查看器 → 使用 `react-native-pdf`（原生库）
- DOCX 文档预览 → WebView + mammoth.js
- PPTX 幻灯片预览 → WebView + 服务端转换
- XLSX 表格预览 → WebView + SheetJS

#### FR-09 消息操作

- 复制消息内容（Markdown / 纯文本）
- 分享消息到其他 App
- 下载附件到手机本地存储
- 消息长按菜单：复制、引用、删除、重新生成

#### FR-10 推送通知

- AI 回复完成时发送本地推送通知
- 权限审批请求推送
- 点击通知跳转到对应会话
- 支持 FCM（Android）+ APNs（iOS）

### 2.3 P2 — 锦上添花（第三版迭代，2 周）

#### FR-11 Widget 沙箱渲染

- 支持 `<widget>` 标签的沙箱 HTML 渲染
- 需在移动端 WebView 沙箱中安全执行

#### FR-12 离线缓存（v2.3 详细设计）

**缓存策略**：
| 策略 | 说明 |
|------|------|
| **存储引擎** | SQLite（react-native-sqlite-storage） |
| **缓存范围** | 最近 30 天或 1000 条消息（取较小值） |
| **缓存大小限制** | 最大 50MB，超过时使用 LRU 淘汰最旧会话 |
| **缓存时机** | 每次收到 SSE 消息时异步写入 SQLite |
| **缓存内容** | 消息文本 + 元数据（时间戳、角色、工具调用摘要） |
| **不缓存内容** | 大型附件（图片/文件）、Mermaid SVG（离线时降级为代码文本） |

**缓存一致性**：
| 场景 | 处理方式 |
|------|----------|
| 桌面端消息修改 | 移动端不感知，下次连接时通过 `chat:message-replay` 同步 |
| 桌面端会话删除 | 移动端保留本地缓存，显示"会话已删除"标记 |
| 移动端离线发送消息 | 本地队列缓存，连接恢复后自动发送 |

**离线行为**：
| 功能 | 离线状态 | 在线状态 |
|------|----------|----------|
| 查看历史消息 | ✅ 可查看（本地缓存） | ✅ 可查看 |
| 发送消息 | ❌ 显示"需要连接" | ✅ 可发送 |
| 接收新消息 | ❌ 不可用 | ✅ 实时接收 |
| 权限审批 | ❌ 显示"需要连接" | ✅ 可审批 |
| 会话列表 | ✅ 显示缓存列表 | ✅ 实时更新 |

#### FR-13 多桌面实例管理

- 保存多个 Sidecar 连接配置
- 快速切换不同的桌面端实例

#### FR-14 暗色/亮色主题

- 跟随系统设置
- 支持手动切换
- 独立聊天字体大小调节

#### FR-15 语音输入

- 调用系统语音识别，转文本后发送
- 支持中英文识别

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│  MyAgents Companion (React Native)                      │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  React Native│  │  SSE 客户端   │  │  原生模块     │  │
│  │  渲染层      │  │  (EventSource)│  │  - 推送通知    │  │
│  │             │  │              │  │  - 深度链接    │  │
│  │  Markdown   │  │  流式接收     │  │  - 剪贴板     │  │
│  │  (RN 原生)  │  │  重连/心跳    │  │  - 文件系统    │  │
│  │  CodeBlock  │  │  优先级过滤   │  │  - 相机/相册   │  │
│  │  (RN 原生)  │  │              │  │  - 生物识别    │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  │
│         │                │                              │
│  ┌──────┴──────┐         │                              │
│  │  WebView    │         │                              │
│  │  渲染层     │         │                              │
│  │  - Mermaid  │         │                              │
│  │  - KaTeX    │         │                              │
│  │  - PDF      │         │                              │
│  │  - DOCX     │         │                              │
│  │  - Widget   │         │                              │
│  └──────┬──────┘         │                              │
│         │                │                              │
│         └───────┬────────┘                              │
│                 │ HTTP / SSE                            │
└─────────────────┼──────────────────────────────────────┘
                  │
    ┌─────────────▼──────────────────────────────────┐
    │  桌面端 Sidecar (Node.js / Hono)               │
    │                                                │
    │  绑定 0.0.0.0:port（需改造）                    │
    │  新增配对码验证 + JWT 签发                      │
    │  新增移动端专用 API 端点                        │
    └────────────────────────────────────────────────┘
```

### 3.2 通信协议

**复用现有 HTTP + SSE 协议，不引入 WebSocket**

| 通信方式 | 用途 | 端点 |
|----------|------|------|
| **HTTP POST** | 发送消息 | `/chat/send` |
| **HTTP GET** | 获取会话列表 | `/api/mobile/sessions` |
| **HTTP GET** | 获取会话详情 | `/api/mobile/session/:id` |
| **SSE** | 流式接收 AI 回复 | `/chat/stream` |
| **HTTP POST** | 工具权限审批 | `/api/mobile/approve/:id` |
| **HTTP POST** | 配对码验证 | `/api/mobile/pair` |

### 3.2.1 SSE 事件处理状态机（v2.3 新增）

> ⚠️ **v2.3 新增**：SSE 事件必须按序处理，网络抖动时需要重连策略，多客户端需要状态同步。

#### 事件顺序保证

```
事件流（必须按序处理）：
  chat:system-init          → 初始化会话状态
  chat:message-chunk (×N)   → 流式文本（coalescible，可合并）
  chat:content-block-stop   → 内容块结束
  chat:tool-use-start       → 工具调用开始
  chat:tool-input-delta (×N)→ 工具输入流式
  chat:tool-result-start    → 工具结果开始
  chat:tool-result-delta (×N)→ 工具结果流式
  chat:tool-result-complete → 工具结果完成
  chat:message-complete     → 消息完成
```

**处理策略**：
- 使用事件队列（FIFO）保证顺序
- critical 事件立即处理，coalescible 事件可合并
- 未知事件记录日志但不处理

#### 网络抖动重连策略

```
重连状态机：
  CONNECTED → 断网 → RECONNECTING → 重连成功 → CONNECTED
                                ↓ 重连失败
                          RETRY (指数退避)
                                ↓ 超过最大重试次数
                          DISCONNECTED → 用户手动重连
```

**重连参数**：
| 参数 | 值 | 说明 |
|------|-----|------|
| 初始重连延迟 | 1s | 首次断网后等待 |
| 最大重连延迟 | 30s | 指数退避上限 |
| 重连倍数 | 2x | 每次重连延迟翻倍 |
| 最大重试次数 | 10 次 | 超过后显示"连接断开" |
| 心跳间隔 | 15s | 检测连接是否存活 |

**重连后状态恢复**：
- 重新建立 SSE 连接
- 接收 `chat:system-init` 恢复会话状态
- 接收 `chat:message-replay` 补发断线期间的消息

#### 多客户端状态同步

**问题**：多个手机同时连接同一 Session，状态可能不一致

**解决方案**：
- SSE 广播天然保证所有客户端收到相同事件
- 每个客户端独立维护本地状态
- 关键状态（消息列表、会话状态）通过 `chat:system-init` 同步
- 权限审批使用请求 ID 去重，第一个响应后其他客户端自动取消

### 3.3 组件复用策略（v2.1 修正）

> ⚠️ **源码验证结论**：文档 v1.0 声称"70% 组件可直接复用"，经 `D:\MyAgents-source` 源码验证，**渲染层复用率为 10-20%，逻辑层复用率为 60-70%**。问题不在 Tauri 依赖，而在所有渲染组件都深度绑定 DOM API 和 Web 专属库。

#### 复用率总结（v2.4 修正）

> ⚠️ **v2.4 修正**：源码验证发现逻辑层复用率从 60-70% 降至 30-40%，SseConnection.ts 不是标准 EventSource 而是 Tauri 代理。

| 层级 | 复用率 | 说明 |
|------|--------|------|
| **API 协议** | 100% | HTTP + SSE 协议完全复用，端点格式不变 |
| **数据格式** | 100% | `src/shared/` 类型定义、SSE 事件名、Session 数据模型、config-types |
| **SSE 客户端** | 0% | SseConnection.ts 是 Tauri 代理（invoke + listen），不是标准 EventSource，需从零实现 |
| **UI 渲染** | 0% | 所有渲染组件必须重写（RN 原生或 WebView） |
| **业务逻辑** | 0% | 移动端不运行 Sidecar，不执行 Agent，业务逻辑需重新实现 |
| **工具展示组件**（tools/） | 逻辑 30% / 渲染 0% | 27 个非测试组件，数据处理逻辑可参考，但 JSX 和上下文需逐个适配 |

**可复用程度详细分析**：

| 可复用程度 | 内容 | 占比 |
|-----------|------|------|
| **可直接复用** | `src/shared/` 类型定义、SSE 事件名、Session 数据模型、config-types | ~30% |
| **需适配器模式** | SSE 事件处理逻辑（TabProvider ~500 行 switch）、chat client API | ~15-20% |
| **不可复用** | 所有 `invoke()` 调用（Rust IPC）、`@tauri-apps/plugin-fs` 文件操作、SseConnection.ts（Tauri 代理）、路径工具、更新/托盘/hooks | ~40-50% |

**关键发现**：
- `SseConnection.ts` 是整个通信层的核心，但它**不是浏览器标准 EventSource**，而是通过 `Tauri invoke + listen` 实现的自定义 SSE 代理
- 移动端需要**从零实现 SSE 客户端**（使用 `react-native-sse` 或原生 `EventSource`）
- `src/shared/` 目录的类型定义可以直接复用（约 30%）

#### tools/ 目录详细分析（v2.4 修正）

> ⚠️ **v2.4 修正**：源码验证发现 tools/ 目录 39 个文件含测试，实际非测试组件 27 个。

| 类别 | 文件数 | 说明 |
|------|--------|------|
| **无 Tauri 依赖** | 27 个 | `BashTool.tsx`、`EditTool.tsx`、`ReadTool.tsx`、`GrepTool.tsx` 等（非测试组件） |
| **有 DOM 使用** | 5 个 | `TaskTool`、`ToolImageAttachment`、`ToolAudioAttachment`、`widgetCssVars`、`WidgetRenderer` |
| **测试文件** | 12 个 | `*.test.tsx` 文件，不参与生产代码 |

**重要说明**：27 个"可复用"的工具组件仍需以下适配工作：
- JSX 元素替换：`<div>`→`<View>`、`<span>`→`<Text>`、`<pre>`→`<ScrollView>` 等
- 样式适配：Tailwind CSS → NativeWind
- 上下文替代：`BrowserPanelContext`、`FileActionContext`、`useWorkspaceFileService` 等需要提供移动端实现或 mock

#### 必须重写的组件（v2.4 修正路径）

> ⚠️ **v2.4 修正**：文档多处路径引用不准确，以下为源码实际位置。

| 组件 | 文档 v1.0 说法 | 源码实际位置 | 源码真相 | 替代方案 |
|------|---------------|-------------|----------|----------|
| **Markdown.tsx** | 直接复用 | `src/renderer/components/Markdown.tsx`（顶层，不在 markdown/ 子目录） | 依赖 `react-markdown` + rehype 管线 + `katex.css` + `URL.createObjectURL` | `react-native-markdown-display` 或自建 |
| **KaTeX** | 直接复用 | **不存在独立文件**，通过 `rehype-katex` 插件内嵌在 Markdown.tsx 的 rehype 管线中 | KaTeX 是 rehype 插件，不是独立组件 | WebView + KaTeX |
| **MermaidDiagram.tsx** | 直接复用 | `src/renderer/components/markdown/MermaidDiagram.tsx` | `mermaid` 库内部用 `document.createElement` 创建 SVG | WebView 渲染 或 服务端 SVG |
| **CodeBlock.tsx** | 直接复用 | `src/renderer/components/markdown/CodeBlock.tsx` | `react-syntax-highlighter`（DOM 渲染）+ `navigator.clipboard` | `react-native-syntax-highlighter` |
| **PdfViewer.tsx** | 直接复用 | `src/renderer/components/richdoc/PdfViewer.tsx` | `document.createElement('canvas')` + `pdfjs-dist` + WebWorker | `react-native-pdf`（原生） |
| **DocxViewer.tsx** | 直接复用 | `src/renderer/components/richdoc/DocxViewer.tsx` | `docx-preview` 库直接操作 DOM | WebView + mammoth.js |
| **WidgetRenderer.tsx** | 适配复用 | `src/renderer/components/tools/WidgetRenderer.tsx` | 基于 `<iframe sandbox>` 沙箱，RN 无 iframe 概念 | `react-native-webview` 沙箱（见 §9.4） |

#### 不复用的组件（桌面专属，需简化替代）

| 组件 | 原因 | 替代方案 |
|------|------|---------|
| TerminalPanel | 依赖 PTY | 不提供终端功能 |
| BrowserPanel | 依赖 Multi-Webview | 链接跳转系统浏览器 |
| CustomTitleBar | 桌面窗口管理 | 原生导航栏 |
| TabBar | 多 Tab 管理 | 单会话 + 返回列表 |

---

## 四、技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| **原生壳** | React Native 0.75+ | 跨平台、性能好、生态成熟 |
| **Markdown 渲染** | `react-native-markdown-display` 或自建 | 桌面端组件绑死 DOM，必须重写 |
| **代码高亮** | `react-native-syntax-highlighter` | 桌面端 `react-syntax-highlighter` 依赖 DOM |
| **Mermaid 渲染** | `react-native-webview` + Mermaid.js | mermaid 库深度绑定 DOM，只能用 WebView |
| **KaTeX 渲染** | `react-native-webview` + KaTeX | KaTeX 需要 DOM，只能用 WebView |
| **PDF 预览** | `react-native-pdf`（原生） | 桌面端 pdfjs-dist 依赖 Canvas + WebWorker |
| **DOCX 预览** | WebView + mammoth.js | 桌面端 docx-preview 直接操作 DOM |
| **SSE 客户端** | react-native-sse | 支持 EventSource polyfill，兼容现有 SSE 协议 |
| **状态管理** | Zustand + React Query | 轻量、支持离线缓存、自动重连 |
| **样式** | NativeWind (Tailwind for RN) | 复用桌面端设计令牌，移动端适配 |
| **推送** | Firebase Cloud Messaging | 跨平台推送标准，Android/iOS 统一 |
| **本地存储** | MMKV + SQLite | MMKV 用于配置，SQLite 用于消息缓存 |
| **深度链接** | React Navigation Linking | 开箱即用，支持自定义协议 |
| **图片加载** | React Native Fast Image | 高性能图片加载，支持缓存 |
| **工具调用展示** | 复用桌面端 tools/ 组件 | 39 个文件中 35 个可复用（仅需元素替换） |

---

## 五、Sidecar 改造需求

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

### 5.2 SC-02 配对码验证与二维码扫描

**配对码验证流程：**

```
1. 用户在桌面端开启「允许移动端连接」
2. 桌面端生成 6 位配对码 + 二维码（包含 host + 配对码）
3. 用户用手机扫码或手动输入配对码
4. 手机端 POST /api/mobile/pair { code: "123456" }
5. 桌面端验证通过 → 返回 JWT Token（7 天有效）
6. 后续请求携带 Authorization: Bearer <token>
```

**二维码内容格式：**

```json
{
  "type": "myagents-pair",
  "host": "192.168.1.5:3210",
  "code": "123456",
  "version": "1.0"
}
```

**Token 续期机制：**
- Token 过期前 24 小时自动续期
- 用户无感知，无需重新配对
- 设备管理：桌面端可查看/撤销已配对设备

### 5.3 SC-03 移动端专用 API 端点

新增少量 API，专为移动端 Companion 设计：

| 端点 | 方法 | 用途 | 说明 |
|------|------|------|------|
| `/api/mobile/pair` | POST | 配对码验证 → 返回 JWT | 首次连接使用 |
| `/api/mobile/sessions` | GET | 列出可用会话（含摘要） | 支持分页、搜索 |
| `/api/mobile/session/:id` | GET | 获取单个会话完整消息 | 支持分页加载 |
| `/api/mobile/session/:id/stream` | GET (SSE) | 实时流式推送 | 复用现有 SSE 协议 |
| `/api/mobile/session/:id/send` | POST | 发送消息（轻量交互） | 文本消息 + 权限审批 |
| `/api/mobile/approve/:request_id` | POST | 工具权限审批 | 允许/拒绝 |

这些端点与现有桌面端 API 并行存在，不修改现有 API 行为。

### 5.4 SC-04 IM 消息格式增强

**当前状态：** IM 适配器将 AI 回复原文直接发送到 IM

**改造：** 在 IM 消息末尾追加深度链接：

```
原始 IM 消息（截断到平台限制）
...
━━━━━━━━━━━━━
📊 含 2 个代码块 · 1 个 Mermaid 图表
🔗 点击查看完整渲染 → myagents://s/{session_id}?h={host}&t={token}
📷 扫码连接：[二维码图片]
```

**配置项：** `imBot.deepLink.enabled`（默认关闭，用户主动开启）

---

## 六、安全设计（v2.1 修正）

> ⚠️ **v2.1 修正**：补充局域网场景下的认证细节，调整第一版安全策略。

### 6.1 分阶段安全策略

| 阶段 | 传输 | 认证 | 说明 |
|------|------|------|------|
| **Phase 1（MVP）** | HTTP + JWT | 配对码验证 | 局域网内 HTTP 风险通过 JWT 认证缓解 |
| **Phase 2（增强）** | HTTPS + 证书钉扎 | 配对码 + JWT | 外网场景必须 HTTPS |

### 6.2 详细安全措施（v2.2 修正）

> ⚠️ **v2.2 修正**：React Native 的 HTTP 请求没有 Origin 概念，CORS 对移动端无意义。认证改为纯 JWT Token 验证。

| 层面 | 措施 | 说明 |
|------|------|------|
| **传输（Phase 1）** | HTTP + JWT | 局域网内 HTTP，风险通过认证缓解 |
| **传输（Phase 2）** | HTTPS + 证书指纹钉扎 | 外网必须 HTTPS，局域网可选 |
| **认证** | 6 位配对码 → JWT Token | Token 有效期 7 天，过期自动续期 |
| **JWT 库** | `jose`（Node.js 生态成熟） | 支持 JWE/JWS，安全可靠 |
| **配对码生成** | `crypto.randomInt(100000, 999999)` | 密码学安全随机数 |
| **请求认证** | `Authorization: Bearer <token>` | 所有请求携带 JWT Token，Sidecar 验证 |
| **输入** | 用户消息长度限制 4000 字符 | 禁止注入式指令 |
| **渲染** | rehype-sanitize XSS 防护 | 移动端 Markdown 渲染同样需要 XSS 防护 |
| **本地存储** | Keychain/Keystore 加密 | 敏感数据（Token）加密存储 |
| **设备管理** | 可查看/撤销已配对设备 | 桌面端 Settings 管理 |

**为什么不用 CORS**：
- React Native 的 HTTP 请求（fetch/axios）不经过浏览器，没有 Origin 概念
- CORS 是浏览器安全机制，对移动端原生 HTTP 请求无效
- 移动端安全通过 JWT Token 验证实现，每次请求都携带 Token

### 6.3 局域网 HTTPS 方案（Phase 2）

**自签证书钉扎流程：**

```
1. 桌面端首次启动时生成自签证书 + 私钥
2. 证书指纹（SHA-256）显示在设置页面
3. 移动端首次连接时验证指纹（手动确认或扫码）
4. 证书存储在移动端本地，后续连接自动验证
5. 证书轮换时通知移动端重新验证
```

**降级方案**：第一版先用 HTTP + JWT，HTTPS 作为后续迭代。局域网内 HTTP 的风险通过 JWT 认证 + CORS 白名单缓解。

---

## 七、性能指标（源码验证后修正）

> ⚠️ **源码验证结论**：由于渲染层需重写（WebView 渲染 Mermaid/KaTeX），性能指标相比 v1.0 文档有所调整。

| 指标 | v1.0 目标 | 修正后目标 | 说明 |
|------|-----------|-----------|------|
| 首屏加载时间 | ≤ 2s | **≤ 3s** | WebView 初始化需要额外时间 |
| 消息渲染延迟 | ≤ 100ms | **≤ 150ms** | WebView 渲染 Mermaid/KaTeX 有额外开销 |
| 流式渲染帧率 | ≥ 30fps | **≥ 25fps** | WebView 渲染复杂内容时可能降帧 |
| 内存占用 | ≤ 150MB | **≤ 200MB** | WebView 实例会增加内存占用 |
| SSE 流式延迟 | ≤ 100ms | **≤ 100ms** | 通信层不受影响 |
| Crash-free 率 | ≥ 99% | **≥ 99%** | 不变 |
| Markdown 渲染一致性 | ≥ 95% | **≥ 85%** | 不同渲染引擎视觉差异 |
| APK 体积 | ≤ 15MB | **≤ 35MB** | WebView + 原生 PDF 库增加体积 |

### 性能优化策略

| 策略 | 说明 |
|------|------|
| **虚拟列表** | 长对话使用 FlatList + 虚拟化，只渲染可见区域 |
| **懒渲染** | Mermaid/KaTeX 按需渲染，滚动到可见区域才加载 |
| **WebView 复用** | 共享 WebView 实例，避免重复初始化 |
| **降级方案** | 大型 Mermaid 图降级为静态图片（服务端预渲染） |
| **缓存策略** | 已渲染的 Markdown/Mermaid 缓存为图片 |

### 7.1 错误处理和降级策略（v2.3 新增）

#### Mermaid 降级策略

| 条件 | 降级方式 | 说明 |
|------|----------|------|
| **节点数 > 100** | 降级为静态图片 | 大型流程图在移动端 WebView 性能差 |
| **SVG 大小 > 500KB** | 降级为静态图片 | 避免内存溢出 |
| **渲染时间 > 2s** | 降级为静态图片 | 用户体验优先 |
| **WebView 崩溃** | 降级为代码文本 | 显示 Mermaid 源码 + "查看大图"按钮 |
| **连续 3 次渲染失败** | 永久降级 | 该会话后续 Mermaid 都显示静态图 |

**降级后的交互能力**：
- 静态图片：支持双指缩放、全屏查看
- 代码文本：支持复制源码、在桌面端查看

**降级触发条件监控**：
```typescript
interface MermaidRenderMetrics {
  nodeCount: number;        // 节点数
  svgSize: number;          // SVG 字节数
  renderTime: number;       // 渲染耗时 (ms)
  memoryUsage: number;      // 内存占用 (MB)
  consecutiveFailures: number; // 连续失败次数
}
```

#### WebView 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| **WebView 初始化失败** | 显示"渲染组件加载失败"，提供重试按钮 |
| **postMessage 超时** | 5s 超时后显示"渲染超时"，降级为代码文本 |
| **WebView 内存溢出** | 强制关闭该 WebView 实例，降级为代码文本 |
| **WebView 崩溃** | 捕获崩溃事件，降级为代码文本，记录日志 |

#### SSE 连接错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| **连接超时** | 显示"连接超时"，提供重试按钮 |
| **认证失败** | 显示"认证失败，请重新配对"，跳转配对页面 |
| **网络断开** | 自动重连（指数退避），显示"正在重连..." |
| **Sidecar 不在线** | 显示"桌面端未启动"，提供离线模式 |

---

## 八、开发里程碑（v2.2 修正）

> ⚠️ **v2.2 修正**：评估报告指出 18-20 周仍偏乐观，调整为 **21-26 周**，增加 Sidecar 改造和 tools/ 适配的缓冲。

### Phase 0：PoC 验证（3 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W1 | WebView 渲染 PoC | 验证 Mermaid/KaTeX 在 WebView 中的可行性和性能 |
| W2 | 通信层 PoC | 验证 SSE 客户端 + Sidecar API 连通性 |
| W3 | 端到端 Spike | 在 RN 中实际调用 Sidecar API + SSE，验证完整链路 |

**PoC 验收标准**：

| 验证项 | 目标 | 说明 |
|--------|------|------|
| **单个 Mermaid 渲染** | ≤ 500ms | 50 节点以内的流程图 |
| **单个 KaTeX 渲染** | ≤ 200ms | 行内公式 + 块级公式 |
| **多 WebView 并发** | ≤ 2s | 3 个 Mermaid + 5 个代码块同时渲染 |
| **WebView 冷启动** | ≤ 1s | 首次打开 WebView 的初始化时间 |
| **RN ↔ WebView 通信** | ≤ 50ms | postMessage 序列化/反序列化延迟 |
| **SSE 流式接收** | 流畅 | 逐字渲染无卡顿 |
| **端到端链路** | 打通 | RN → HTTP → Sidecar → SSE → UI 渲染 |

**⚠️ 关键验证：多 WebView 实例并发渲染**
- 场景：一个页面同时有 3 个 Mermaid 图表 + 5 个代码块
- 验证：内存占用、渲染延迟、滚动流畅度
- 降级方案：如果并发 WebView 性能不达标，改为串行渲染或共享 WebView 实例

### Phase 1：MVP（8-10 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W4-5 | React Native 项目 + 通信层 | 项目脚手架 + SSE 客户端 + HTTP API 客户端（全新开发） |
| W6 | Markdown 渲染（基础） | react-native-markdown-display + 代码高亮 |
| W7 | Mermaid/KaTeX 渲染 | WebView 渲染方案实现 |
| W8-9 | Sidecar 改造（SC-01/02/03） | 绑定地址可配置 + 配对码 + JWT 认证 + 移动端 API |
| W10 | 深度链接 + IM 集成 | IM 消息带深度链接 → 点击跳转 App → 加载会话 |
| W11-12 | 集成测试 + 修复 | 端到端测试 + Bug 修复 + 多设备适配 |

**MVP 验收标准：** 在手机上通过 IM 深度链接打开 App，看到 Markdown + 代码高亮 + Mermaid 图表。

### Phase 2：增强（6-8 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W13-14 | 工具调用可视化 | 34 个工具组件适配（JSX 元素替换 + 上下文 mock/实现） |
| W15 | 轻量交互 | 发送消息 + 权限审批（通过 Sidecar 代理） |
| W16 | 会话管理 | 多会话列表 + 搜索 + 切换 |
| W17 | 富文档预览 | PDF（react-native-pdf）+ DOCX（WebView + mammoth） |
| W18 | 推送通知 + 消息操作 | FCM 推送 + 复制/分享/下载 |
| W19-20 | 集成测试 + 修复 | 端到端测试 + 性能调优 |

### Phase 3：打磨（5 周）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W21 | 局域网发现 + 内网穿透 | 二维码扫描 + Cloudflare Tunnel 支持 |
| W22 | 离线缓存 + 性能优化 | 本地缓存 + 虚拟列表 + 启动优化 + 懒渲染 |
| W23 | UI 打磨 + 多实例管理 | 主题适配 + 多连接管理 + 字体调节 |
| W24 | HTTPS 支持（Phase 2 安全） | 自签证书 + 证书钉扎 |
| W25-26 | 缓冲 + 测试 + 发布准备 | 回归测试 + 性能调优 + 应用商店素材 |

**总工期：21-26 周**（含 3 周 PoC + 5 周缓冲）

---

## 九、架构约束与限制（v2.2 新增）

### 9.1 多客户端并发

**场景**：多个手机同时连接同一个桌面端 Sidecar

| 问题 | 当前行为 | 移动端影响 |
|------|----------|-----------|
| **SSE 广播** | 所有连接的客户端都收到相同事件 | 多手机同时收到消息，正常 |
| **Session 状态** | 1:1 模型，一个 Session 一个 Sidecar | 多手机连接同一 Session，都看到相同内容 |
| **消息发送** | 同一时间只能有一个消息在处理 | 多手机同时发消息会排队，需要 UI 提示 |
| **权限审批** | 第一个响应的客户端生效 | 多手机同时收到审批请求，需要互斥 |

**解决方案**：
- SSE 广播天然支持多客户端，无需改动
- 消息发送使用 Sidecar 已有的队列机制（`queue:added/started/cancelled`）
- 权限审批使用请求 ID 去重，第一个响应后其他客户端自动取消

### 9.2 Claude Agent SDK 移动端兼容性

**结论**：移动端**不需要也不应该**运行 Claude Agent SDK。

| 方面 | 说明 |
|------|------|
| **SDK 二进制** | Claude Agent SDK 的 native binary 没有 Android 构建 |
| **SDK 依赖** | SDK 依赖 Node.js child_process、MCP、长生命周期子进程 |
| **移动端定位** | 移动端是**客户端**，通过 HTTP/SSE 与桌面端 Sidecar 通信 |
| **消息发送** | 移动端发送消息 → Sidecar 接收 → Sidecar 调用 SDK → 结果通过 SSE 返回 |

**FR-06（轻量交互）的技术路线**：
```
移动端发送消息 → POST /api/mobile/session/:id/send → Sidecar 接收
                                                      ↓
                                              Sidecar 调用 SDK
                                                      ↓
                                              SDK 处理完成
                                                      ↓
移动端接收响应 ← SSE 推送 chat:message-chunk ← Sidecar 广播
```

### 9.3 Sidecar 改造复杂度评估（v2.4 修正）

> ⚠️ **v2.4 修正**：源码验证发现 Sidecar 改造比预期复杂，涉及 Rust 代理层、SSE 代理、安全中间件。

| 改造项 | 复杂度 | 代码量 | 说明 |
|--------|--------|--------|------|
| **SC-01 绑定地址** | 中 | ~50 行 TS | 改 `hostname: '127.0.0.1'` 为配置项（1 行），但需要处理端口冲突、日志输出 |
| **SC-02 配对码 + JWT** | 高 | ~300-400 行 TS | 新增认证中间件 + JWT 签发/验证 + 设备管理 |
| **SC-03 移动端 API** | 中 | ~500-600 行 TS | 新增 6 个端点，复用现有 session/message 逻辑 |
| **SC-04 IM 消息增强** | 低 | ~50 行 Rust | 在 `reply_router.rs` 追加深度链接 |
| **Rust 代理层改造** | 高 | ~400-600 行 Rust | `local_http.rs` 的 `request_target_is_loopback()` 需要新增局域网路由路径 |
| **SSE 代理改造** | 中 | ~200-300 行 Rust | `sse_proxy.rs` 需要新的错误分类逻辑（局域网 vs 外部） |
| **安全中间件** | 高 | ~200-300 行 TS | 所有现有 API 端点零认证，新增 JWT 认证中间件意味着每个路由都要过一遍 |

**总改动量**：约 1650-2350 行代码（800-1200 行 Rust + 850-1150 行 TypeScript）

**关键发现**：
- `local_http.rs` 的模块文档明确写着 "All HTTP requests to local Sidecars (127.0.0.1) MUST use these builders"
- `request_target_is_loopback()` 检查覆盖整个 `127.0.0.0/8`，外部 IP 会走完全不同的代理路径
- 移动端请求到达 Rust 层后，需要新增一条"非 loopback 但非外部"的路由路径
- `sse_proxy.rs` 中 localhost 连接失败是 WARN 级别，外部是 ERROR 级别，局域网请求需要新的错误分类逻辑

### 9.4 WidgetRenderer 安全模型评估（v2.4 新增）

> ⚠️ **v2.4 修正**：源码验证发现 WidgetRenderer 的安全模型比预期复杂。

**桌面端安全模型**：
```typescript
// 源码：src/renderer/components/tools/WidgetRenderer.tsx
<iframe
  sandbox="allow-scripts"  // 无 allow-same-origin
  srcDoc={sanitizedHtml}
  // 严格 CSP 策略
  // 仅通过 postMessage 通信
  // 流式预览时剥离所有 <script> 和 on* 事件
/>
```

**移动端挑战**：

| 问题 | 说明 |
|------|------|
| **RN WebView 不是 iframe** | React Native 的 WebView 是独立实例，不是 iframe，安全边界不同 |
| **无 CSP 级别隔离** | RN WebView 有 `onMessage` / `injectJavaScript` 接口，但没有 CSP 级别的隔离 |
| **需要自行实现 sanitize** | 需要自行实现 `sanitizeForStreaming()` 逻辑，剥离 `<script>` 和 `on*` 事件 |
| **内存压力** | 多个 Widget 意味着多个 WebView 实例，内存压力更大 |

**移动端 WidgetRenderer 方案**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **独立 WebView 实例** | 安全隔离好 | 内存压力大，多个 Widget 会卡顿 |
| **共享 WebView + postMessage** | 内存友好 | 安全隔离差，需要严格 sanitize |
| **降级为静态 HTML** | 最安全 | 交互能力差 |

**建议**：
- Phase 1：降级为静态 HTML（剥离所有 `<script>` 和 `on*` 事件）
- Phase 2：共享 WebView + postMessage（需要严格 sanitize）
- Phase 3：独立 WebView 实例（仅用于高交互 Widget）

## 十、风险与缓解（v2.2 修正）

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **渲染层重写工作量大** | 高 | 高 | 先做 3 周 PoC 验证 WebView 渲染方案，提前暴露问题 |
| **WebView 渲染性能不足** | 中 | 高 | 虚拟列表 + 懒渲染 + 降级方案（大图→静态图） |
| **RN 与 WebView 边界协调** | 中 | 中 | 设计清晰的通信协议（postMessage），减少跨层调用 |
| **Sidecar 改造比预期复杂** | 中 | 中 | 预留 2 周缓冲，SC-01/04 先行，SC-02/03 后续 |
| **多客户端并发问题** | 中 | 中 | 利用 Sidecar 已有队列机制，权限审批请求 ID 去重 |
| Sidecar 暴露到局域网有安全风险 | 中 | 高 | 配对码 + JWT + 设备管理（Phase 1） |
| Mermaid 大图渲染卡顿 | 中 | 中 | 懒加载 + 预渲染缓存 + 服务端 SVG 预渲染 |
| IM 平台不支持深度链接 | 低 | 高 | 降级为复制链接手动打开 |
| iOS App Store 审核（WebView 类 App） | 中 | 中 | 见 §10.1 iOS App Store 审核策略 |
| 桌面端 Sidecar 不在线 | 中 | 高 | 离线缓存 + 重连机制 + 提示用户启动桌面端 |
| **工期超预期** | 中 | 中 | 预留 5 周缓冲（21-26 周），分阶段交付，可缩减 P2 范围 |

### 10.1 iOS App Store 审核策略（v2.3 新增）

**审核风险**：WebView 类 App 可能被拒（Guideline 4.2 - Minimum Functionality）

**应对策略**：

| 策略 | 说明 |
|------|------|
| **原生功能占比** | 确保 50%+ 的功能是原生实现（推送、深度链接、剪贴板、文件系统、相机） |
| **独特价值证明** | 强调"IM 机器人 + 深度链接 + 完整渲染"的独特价值，不是简单的 WebView 壳 |
| **用户生成内容** | App 展示的是用户自己的 AI 对话，不是爬取的网页内容 |
| **离线功能** | 离线缓存历史消息，证明不是纯在线 WebView |
| **App Store 描述** | 强调"MyAgents 桌面端的移动伴侣"，不是"浏览器" |

**审核指南参考**：
- Guideline 4.2.1：App 应提供足够的原生功能
- Guideline 4.2.2：不能只是包装网站的 WebView
- Guideline 4.2.3：需要有独特的价值和功能

**准备材料**：
- App Store 截图：展示深度链接跳转、Markdown 渲染、工具调用可视化
- App Store 描述：强调"IM 机器人 + 移动端渲染"的独特价值
- 审核说明：解释 App 与桌面端 MyAgents 的关系

### 10.2 测试策略（v2.3 新增）

| 测试类型 | 工具 | 覆盖率目标 | 说明 |
|----------|------|-----------|------|
| **单元测试** | Jest + React Native Testing Library | ≥ 70% | 核心逻辑、SSE 客户端、状态管理 |
| **组件测试** | React Native Testing Library | ≥ 60% | UI 组件渲染、交互 |
| **E2E 测试** | Maestro（推荐）或 Detox | 核心流程 | 深度链接 → 连接 → 加载会话 → 查看消息 |
| **性能测试** | 自定义基准 | 达标 | 首屏加载、渲染延迟、内存占用 |
| **兼容性测试** | BrowserStack / 真机 | Top 10 机型 | Android 8.0+ / iOS 15+ |

**E2E 测试用例**：
1. 首次配对流程：扫码 → 输入配对码 → 连接成功
2. 深度链接流程：点击 IM 链接 → 打开 App → 加载会话
3. 消息渲染流程：接收 SSE → 渲染 Markdown → 显示 Mermaid
4. 离线模式流程：断网 → 查看缓存 → 恢复网络 → 同步消息

---

## 十一、成功指标（v2.2 修正）

| 指标 | v1.0 目标 | v2.2 目标 |
|------|-----------|-----------|
| IM 消息点击率（深度链接） | ≥ 40% | ≥ 40% |
| App 首屏加载时间 | ≤ 2s | **≤ 3s** |
| Markdown 渲染与桌面端视觉一致性 | ≥ 95% | **≥ 85%** |
| SSE 流式延迟（局域网） | ≤ 100ms | ≤ 100ms |
| Crash-free 率 | ≥ 99% | ≥ 99% |
| 用户满意度（NPS） | ≥ 50 | ≥ 40 |
| 开发周期 | 9 周 | **21-26 周** |

---

## 十二、与原方案的对比（v2.2 修正）

| 维度 | 乙方 A（Capacitor） | 乙方 B（Jetpack Compose） | 合并版 v1.0 | 合并版 v2.2（修正） |
|------|---------------------|--------------------------|-------------|-------------------|
| 技术可行性 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 性能表现 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 开发效率 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 功能完整性 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 安全设计 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 工期合理性 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **总分** | 23 | 16 | 29 | **23** |

**修正说明**：
- 技术可行性：从 5 星降到 4 星（渲染层需重写，不是"直接复用"）
- 性能表现：从 4 星降到 3 星（WebView 渲染 Mermaid/KaTeX 有性能开销）
- 开发效率：从 4 星降到 3 星（API 协议 100% 复用，但 UI 和业务逻辑需全新开发）
- 安全设计：从 5 星降到 4 星（Phase 1 先用 HTTP + JWT，HTTPS 后续迭代）
- 工期合理性：从 4 星降到 3 星（工期从 9 周增加到 21-26 周）

---

## 十二、附录

### A. 深度链接协议（v2.1 修正）

> ⚠️ **v2.1 修正**：Token 不再放在 URL 中（会被系统日志记录），改为首次配对后存储在本地。

```
myagents://s/{session_id}?h={host}

参数：
  session_id  - 会话 ID（必需）
  host        - Sidecar 地址，格式 host:port（必需）

示例：
  myagents://s/ses_abc123?h=192.168.1.5:3210
  myagents://s/ses_abc123?h=myagent-tunnel.example.com:443
```

**Token 存储策略：**
- 首次配对后，JWT Token 存储在 Keychain/Keystore
- 深度链接只带 `session_id` + `host`
- 连接时从本地存储读取 Token
- Token 过期自动续期，用户无感知

**Android 注意事项：**
- 需确认 `myagents` scheme 未被其他 App 注册
- 建议使用 App Links（HTTPS）作为备选方案

**iOS 注意事项：**
- 支持 Universal Links 作为备选
- 自定义 scheme 需在 Info.plist 注册

### B. SSE 事件处理优先级

> ⚠️ **v2.1 修正**：文档 v2.0 只列出 13 个事件，实际源码中有 **50+ 个**事件。以下为移动端必须处理的完整列表。

#### 必须处理（critical）— 消息生命周期

```
chat:message-chunk           → 流式追加文本（最高频）
chat:message-complete        → 消息完成，触发最终渲染
chat:message-error           → 错误展示
chat:message-stopped         → 消息被中断
chat:message-replay          → 历史消息回放（连接时）
chat:message-sdk-uuid        → SDK 消息 ID
```

#### 必须处理（critical）— 思考过程

```
chat:thinking-start          → 思考中动画开始
chat:thinking-chunk          → 思考过程流式展示（coalescible 但需处理）
```

#### 必须处理（critical）— 工具调用

```
chat:tool-use-start          → 工具调用开始
chat:tool-input-delta        → 工具输入流式展示（coalescible）
chat:tool-result-start       → 工具结果开始
chat:tool-result-delta       → 工具结果流式展示（coalescible）
chat:tool-result-complete    → 工具结果完成
chat:tool-attachment-update  → 工具附件更新
chat:server-tool-use-start   → 服务端工具调用开始
chat:attachments-filtered    → 附件过滤通知
chat:attachments-fallback    → 附件降级通知
```

#### 必须处理（critical）— 交互式请求

```
permission:request           → 工具权限审批弹窗（必须响应）
ask-user-question:request    → 用户选择题弹窗（必须响应）
ask-user-question:expired    → 选择题超时
enter-plan-mode:request      → 进入计划模式通知
exit-plan-mode:request       → 退出计划模式通知
enter-plan-mode:expired      → 进入计划模式超时
exit-plan-mode:expired       → 退出计划模式超时
```

#### 必须处理（critical）— 系统状态

```
chat:system-init             → 系统初始化（连接握手）
chat:system-status           → 系统状态变更
chat:status                  → 会话状态（running/idle）
chat:init                    → 会话初始化数据
chat:agent-error             → Agent 错误
chat:api-retry               → API 重试
chat:permission-mode-changed → 权限模式变更
chat:session-title-changed   → 会话标题变更
```

#### 必须处理（critical）— 队列与任务

```
queue:added                  → 消息加入队列
queue:started                → 队列开始处理
queue:cancelled              → 队列取消
chat:task-notification       → 任务通知
chat:task-started            → 任务开始
cron:task-exit-requested     → 定时任务退出请求
```

#### 必须处理（critical）— 配置与插件

```
config:changed               → 配置变更
plugin:install-progress      → 插件安装进度
plugins:changed              → 插件列表变更
mcp:oauth-expired            → MCP OAuth 过期
```

#### 可选处理（coalescible）— 流式增量

```
chat:thinking-chunk          → 思考过程流式展示
chat:tool-input-delta        → 工具输入流式展示
chat:tool-result-delta       → 工具结果流式展示
chat:subagent-tool-input-delta   → 子代理工具输入
chat:subagent-tool-result-delta  → 子代理工具结果
chat:context-usage           → 上下文 token 使用量（状态栏展示）
```

#### 忽略（droppable）— 日志与调试

```
chat:log                     → 不展示日志
chat:logs                    → 不展示日志批量
chat:debug-message           → 不展示调试信息
chat:runtime-diagnostics     → 不展示运行时诊断
```

#### 移动端事件处理策略

| 策略 | 说明 |
|------|------|
| **critical 事件** | 必须处理，否则功能异常 |
| **coalescible 事件** | 按需处理，支持合并（40ms 窗口） |
| **droppable 事件** | 直接忽略，不影响功能 |
| **未知事件** | 记录日志但不处理，避免异常崩溃 |

### C. 项目结构（v2.2 修正）

> ⚠️ **v2.2 修正**：修正 markdown/ 和 richdoc/ 的注释，与 §3.3 保持一致。

```
myagents-companion/
├── package.json
├── metro.config.js              // React Native 构建配置
├── babel.config.js
├── src/
│   ├── main.tsx                 // 入口
│   ├── App.tsx                  // 路由 + 状态
│   ├── screens/
│   │   ├── ConnectionScreen.tsx // 连接管理
│   │   ├── SessionListScreen.tsx// 会话列表
│   │   └── ChatScreen.tsx      // 聊天阅读器
│   ├── components/
│   │   ├── markdown/           // ⚠️ 需重写（桌面端绑死 DOM）
│   │   │   ├── Markdown.tsx    // → react-native-markdown-display
│   │   │   ├── CodeBlock.tsx   // → react-native-syntax-highlighter
│   │   │   ├── MermaidDiagram.tsx // → WebView + Mermaid.js
│   │   │   └── KaTeX.tsx      // → WebView + KaTeX
│   │   ├── richdoc/            // ⚠️ 需重写（桌面端绑死 DOM）
│   │   │   ├── PdfViewer.tsx   // → react-native-pdf
│   │   │   ├── DocxViewer.tsx  // → WebView + mammoth.js
│   │   │   └── SheetViewer.tsx // → WebView + SheetJS
│   │   ├── tools/              // ⚠️ 逻辑可复用，渲染需适配
│   │   │   ├── BashTool.tsx    // 逻辑复用，JSX 需适配
│   │   │   ├── EditTool.tsx    // 逻辑复用，JSX 需适配
│   │   │   ├── ReadTool.tsx    // 逻辑复用，JSX 需适配
│   │   │   └── ...             // 共 34 个无 Tauri 依赖
│   │   └── mobile/             // 移动端专属组件（全新开发）
│   │       ├── ConnectionCard.tsx
│   │       ├── SessionCard.tsx
│   │       ├── MobileInputBar.tsx
│   │       ├── QRCodeScanner.tsx
│   │       └── SwipeNavigator.tsx
│   ├── hooks/
│   │   ├── useSSE.ts           // SSE 连接管理
│   │   ├── useSidecar.ts       // Sidecar API 封装
│   │   └── useDeepLink.ts      // 深度链接处理
│   ├── services/
│   │   ├── sse-client.ts       // SSE 客户端（重连/心跳/优先级）
│   │   ├── sidecar-api.ts      // HTTP API 客户端（全新开发，非 tauriClient）
│   │   ├── discovery.ts        // 二维码扫描 + 局域网发现
│   │   └── auth.ts             // 配对码 + JWT 管理
│   ├── utils/
│   │   └── platform.ts         // 平台检测（iOS/Android）
│   └── styles/
│       └── mobile.css          // 移动端适配样式
├── android/                    // React Native Android 项目
├── ios/                        // React Native iOS 项目
└── resources/                  // 图标 + 启动画面
```

---

**文档版本**：v2.4（源码验证修正版）  
**创建日期**：2026-06-12  
**最后更新**：2026-06-12  
**作者**：AI 助手（综合乙方 A 和乙方 B 需求文档）  
**源码验证**：基于 `D:\MyAgents-source` 仓库验证，修正组件复用率和工期估算  
**v2.4 修正**：修正逻辑层复用率（60-70%→30-40%）、Sidecar 改造复杂度、文件路径引用、SSE 事件遗漏、WidgetRenderer 安全模型
