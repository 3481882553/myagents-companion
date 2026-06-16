# MyAgents Companion 开发调试指南

> 本文档描述移动端 App 的开发调试环境搭建和端到端测试流程。

## 一、两种调试模式

| | Mock Server | 源码 Sidecar（推荐） |
|------|------------|-------------------|
| 数据 | 内置 3 个 Demo 会话 | 真实 `~/.myagents/` 数据 |
| 依赖 | 零依赖，独立 Node.js 服务 | 需要 `D:\MyAgents-source` 源码 |
| 启动 | `cd mock-server && npx tsx start-mobile.ts` | `cd D:\MyAgents-source && npx tsx src/server/index.ts` |
| 适用 | 快速验证 UI 渲染 | 端到端真数据测试 |

---

## 二、环境准备

### 2.1 前置依赖

| 工具 | 路径 | 说明 |
|------|------|------|
| Node.js | `D:\MyAgents\nodejs\node.exe` | v24.14.0（MyAgents 内置） |
| Android SDK | `D:\AndroidSdk` | 含 adb、模拟器、Java |
| MyAgents 源码 | `D:\MyAgents-source` | 含 mobile-server |
| Gradle 缓存 | `D:\gradle-cache` | APK 构建缓存 |
| Metro 缓存 | `D:\metro-cache` | RN 打包缓存 |

### 2.2 环境变量

```powershell
MYAGENTS_MOBILE_PORT=32102  # Sidecar 启用 mobile-server 的端口（已用 setx 持久化）
ANDROID_HOME=D:\AndroidSdk
JAVA_HOME=D:\AndroidSdk\
GRADLE_USER_HOME=D:\gradle-cache
```

### 2.3 验证

```bash
adb devices                          # → emulator-5554  device
node --version                       # → v24.14.0
java -version                        # → 1.8.0_481
```

---

## 三、源码 Sidecar 模式（推荐：真实 MyAgents 数据）

### 3.1 原理

MyAgents 源码 `D:\MyAgents-source\src\server\index.ts` 里集成了 `mobile-server.ts`。设置 `MYAGENTS_MOBILE_PORT=32102` 环境变量后，Sidecar 启动时会自动在 `0.0.0.0:32102` 上启动移动端 HTTP 服务，提供完整的 `/api/session/*` 端点。

```
源码 Sidecar (npx tsx src/server/index.ts)
├─ 主 API: 127.0.0.1:31500  (--port 31500)
├─ Mobile API: 0.0.0.0:32102 (MYAGENTS_MOBILE_PORT=32102)
│    ├─ POST /api/pair              配对码: 123456
│    ├─ GET  /api/session/list      真实会话列表
│    ├─ GET  /api/session/messages  真实消息数据
│    ├─ GET  /api/session/stream    SSE 流式推送
│    └─ POST /api/session/send      发送消息 → Agent 处理
└─ 读写 ~/.myagents/ 真实数据
```

### 3.2 启动

在新的 cmd 或 PowerShell 窗口中：

```cmd
set MYAGENTS_MOBILE_PORT=32102
cd D:\MyAgents-source
npx tsx src/server/index.ts --port 31500 --agent-dir %USERPROFILE%\.myagents
```

输出：
```
[startup] Sidecar HTTP server ready on http://127.0.0.1:31500
[mobile] Mobile HTTP server ready on http://0.0.0.0:32102
[mobile] Pair code: 123456
[boot] pid=... port=31500 ... mobile=32102
```

> `[boot]` 日志里出现 `mobile=32102` 即表示 mobile-server 已启动。

### 3.3 验证

```bash
# 主 API 健康检查
curl http://127.0.0.1:31500/health
# → {"status":"ok","timestamp":...}

# 移动端 API 健康检查
curl http://127.0.0.1:32102/health/live
# → {"status":"ok","service":"mobile"}

# 配对（配对码: 123456）
curl -X POST http://127.0.0.1:32102/api/pair \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
# → {"success":true,"token":"eyJ..."}

# 会话列表（用上一步获取的 token）
curl http://127.0.0.1:32102/api/session/list \
  -H "Authorization: Bearer $TOKEN"
# → {"sessions":[...]}  -- 真实的 ~/.myagents/ 会话
```

### 3.4 API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/pair` | 无 | 配对码验证 → JWT（配对码 hardcode: `123456`） |
| GET | `/api/session/list` | JWT | 真实会话列表 |
| GET | `/api/session/messages?sessionId=...` | JWT | 真实会话消息 |
| GET | `/api/session/stream?sessionId=...` | JWT | SSE 实时流式推送 |
| POST | `/api/session/send` | JWT | 发送消息 `{"sessionId":"...","message":"..."}` |
| POST | `/api/session/create` | JWT | 创建新会话 |
| POST | `/api/permission/respond` | JWT | 工具权限审批 |
| GET | `/health/live` | 无 | 健康检查 |

---

## 四、Mock Server 模式（不依赖 MyAgents 桌面端）

Mock Server 是独立 Node.js 服务，内置 3 个 Demo 会话，**不需要** MyAgents 源码或桌面端运行。适合快速验证 UI 渲染和 SSE 流式效果。

### 4.1 启动

```cmd
cd D:\myagents-android\poc\mock-server
npx tsx start-mobile.ts
```

### 4.2 Mock 数据

| Session ID | 标题 | 消息数 | 包含 |
|-----------|------|--------|------|
| `ses_demo_001` | Demo: AI 代码审查 | 24 | Markdown + 代码块 + 表格 + 工具调用 |
| `ses_demo_002` | Demo: 数据分析报告 | 42 | Mermaid 图表 |
| `ses_demo_003` | Demo: 定时任务配置 | 15 | 基础对话 |

SSE 端点会**逐词流式推送**一段包含 Markdown 和代码块的 Demo 回复（80ms/词），完整模拟 AI 回复效果。

### 4.3 与源码 Sidecar 的端点兼容性

Mock Server 提供与源码 Sidecar 兼容的所有 API 端点（路径、请求/响应格式一致），App 无需任何代码修改即可切换。

---

## 五、构建和部署到模拟器

### 5.1 构建 APK

```bash
cd D:\myagents-android\poc\app\android

# Debug 构建（首次 ~2 分钟，增量 ~10 秒）
./gradlew assembleDebug

# 产物
# app/build/outputs/apk/debug/app-debug.apk
```

### 5.2 完整构建+部署

```bash
cd D:\myagents-android\poc\app\android && \
./gradlew assembleDebug && \
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk && \
adb -s emulator-5554 shell am force-stop com.myagentscompanion && \
adb -s emulator-5554 shell am start -n com.myagentscompanion/.MainActivity
```

### 5.3 Metro Bundler（仅开发模式）

开发模式下 Metro 提供 JS bundle 热更新：

```bash
# 终端 1：启动 Metro
cd D:\myagents-android\poc\app
npx react-native start --no-interactive

# 终端 2：设置 adb 转发
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

> 如果不启动 Metro，APK 需要包含预打包的 JS bundle（Release 构建）。

---

## 六、App 连接配置

### 6.1 模拟器连接

**地址填 `localhost`**（不是 `10.0.2.2`）。

| 字段 | 值 | 原因 |
|------|-----|------|
| 主机地址 | `localhost` | adb reverse 将模拟器 localhost 转发到宿主机 |
| 端口 | `32102` | 默认值 |
| 配对码 | `123456` | hardcode |

### 6.2 真机连接

| 字段 | 值 |
|------|-----|
| 主机地址 | 宿主机局域网 IP（如 `192.168.1.5`） |
| 端口 | `32102` |
| 配对码 | `123456` |

> 真机需要和 PC 在同一局域网，且 Windows 防火墙允许 32102 端口入站。

### 6.3 adb 端口转发

```bash
# 设置转发
adb -s emulator-5554 reverse tcp:32102 tcp:32102   # Mobile API
adb -s emulator-5554 reverse tcp:8081 tcp:8081     # Metro Bundler

# 查看所有转发
adb -s emulator-5554 reverse --list

# 清除
adb -s emulator-5554 reverse --remove-all
```

**adb reverse 原理**：

```
模拟器 localhost:32102 → adb → 宿主机 127.0.0.1:32102
```

所以 App 里填 `localhost` 即可访问宿主机服务。

---

## 七、完整启动检查清单

每次开发调试按顺序执行：

```bash
# 1. 启动 Metro Bundler
cd D:\myagents-android\poc\app
npx react-native start --no-interactive &

# 2. 启动源码 Sidecar + Mobile Server（在新的 cmd 窗口）
set MYAGENTS_MOBILE_PORT=32102
cd D:\MyAgents-source
npx tsx src/server/index.ts --port 31500 --agent-dir %USERPROFILE%\.myagents

# 3. 设置 adb 转发
adb -s emulator-5554 reverse tcp:8081 tcp:8081
adb -s emulator-5554 reverse tcp:32102 tcp:32102

# 4. 构建并部署
cd D:\myagents-android\poc\app\android
./gradlew assembleDebug && \
adb -s emulator-5554 install -r app/build/outputs/apk/debug/app-debug.apk && \
adb -s emulator-5554 shell am start -n com.myagentscompanion/.MainActivity
```

---

## 八、调试技巧

### 8.1 日志查看

```bash
# App JS 日志
adb -s emulator-5554 logcat -s ReactNativeJS:I

# 崩溃日志
adb -s emulator-5554 logcat -b crash

# 源码 Sidecar 日志：直接看启动它的终端窗口

# Mock Server 日志：直接看启动它的终端窗口
```

### 8.2 截图

```bash
adb -s emulator-5554 exec-out screencap -p > screenshot.png
```

### 8.3 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 连接失败 `Aborted` | 地址填错或服务没启动 | 确认地址是 `localhost`（模拟器），Sidecar/Mock Server 在 32102 监听 |
| App 白屏/崩溃 | Metro 未连上 | 确保 Metro 在 8081 运行，`adb reverse tcp:8081` 已设 |
| `EADDRINUSE 32102` | 端口被占用 | 先停掉占用的进程 |
| `react-native-nitro-modules` 找不到 | MMKV 新架构依赖缺失 | 已在 metro.config.js stub 解决，不影响运行 |
| Gradle 编译失败 | 缓存问题 | `./gradlew clean` 重试 |

---

## 九、运行单元测试

```bash
cd D:\myagents-android\poc\app

# W1 核心逻辑测试
npx jest --testPathPattern="messageStore|SseEventToStore|SseClient|EventCoalescer|streaming-utils"

# W1+ChatScreen 测试
npx jest --testPathPattern="messageStore|SseEventToStore|SseClient|EventCoalescer|streaming-utils|ChatScreen"
```

---

## 十、项目端口速查

| 端口 | 服务 | 绑定 | 说明 |
|------|------|------|------|
| 32102 | Mobile API | 0.0.0.0 | 移动端 HTTP/SSE 端点 |
| 31500 | 源码 Sidecar 主 API | 127.0.0.1 | `--port 31500` |
| 31416 | 安装版 Session Sidecar | 127.0.0.1 | 桌面端会话 |
| 31415 | 安装版 Global Sidecar | 127.0.0.1 | 桌面端全局 |
| 52619 | Management API | 127.0.0.1 | Rust↔Node IPC |
| 8081 | Metro Bundler | 0.0.0.0 | RN JS 打包 |
| 5554 | Android Emulator | — | adb 连接 |

---

**文档版本**：v2.0  
**最后更新**：2026-06-16（源码 Sidecar 启动方式 + Mock Server 对比）
