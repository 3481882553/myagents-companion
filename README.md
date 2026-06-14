# MyAgents Mobile Companion

> MyAgents 的移动端伴侣应用，通过手机查看和参与 AI 对话。

## 功能

- 📱 **连接桌面端** — 配对连接 MyAgents Sidecar
- 💬 **会话管理** — 查看所有对话历史
- 📝 **消息渲染** — Markdown + 工具调用可视化
- 🤖 **小助理** — 内置 AI 助手，支持诊断和问题排查
- 🔗 **深度链接** — 从 IM 消息直接打开对话

## 架构

```
手机端 (React Native) → HTTP → Sidecar (Node.js) → AI Provider
```

## 快速开始

### 前置条件

- Node.js 18+
- Java 17 (JDK)
- Android SDK
- MyAgents 桌面端运行中

### 开发模式

```bash
# 1. 安装依赖
cd poc/app && npm install

# 2. 启动 Metro bundler
npx react-native start --port 8081

# 3. 构建并安装 debug APK
cd android && ./gradlew.bat app:installDebug

# 4. 设置 ADB 端口转发
adb reverse tcp:8081 tcp:8081
adb reverse tcp:32107 tcp:32107
```

### Release 模式

```bash
cd poc/app/android && ./gradlew.bat app:installRelease
```

## 项目结构

```
myagents-android/
├── poc/app/                    # React Native 应用
│   ├── src/
│   │   ├── screens/            # 页面组件
│   │   │   ├── HomeScreen      # 首页
│   │   │   ├── ConnectionScreen # 连接管理
│   │   │   ├── SessionListScreen # 会话列表
│   │   │   ├── ChatScreen      # 聊天界面
│   │   │   └── HelperScreen    # 小助理
│   │   ├── components/         # 可复用组件
│   │   │   ├── markdown/       # Markdown 渲染
│   │   │   └── tools/          # 工具调用渲染
│   │   ├── utils/              # 工具函数
│   │   └── theme/              # 主题配置
│   └── android/                # Android 原生配置
├── v3.0-*.md                   # 设计文档
└── README.md
```

## 技术栈

- **框架**: React Native 0.76
- **语言**: TypeScript
- **状态管理**: React hooks (useState/useMemo)
- **存储**: 内存存储 (PoC 阶段)
- **样式**: StyleSheet

## 开发阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| W4-W5 | 通信层 + 认证 | ✅ |
| W6 | Markdown 渲染 | ✅ |
| W8-9 | Sidecar 对接 | ✅ |
| W10 | 消息发送 | ✅ |
| W6+ | 消息渲染升级 | ✅ |
| W11 | 小助理 MVP | ✅ |
| W12-13 | 测试 + 修复 | ✅ |

## License

MIT License

基于 [MyAgents](https://github.com/hAcKlyc/MyAgents)（Apache 2.0）衍生。
