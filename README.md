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

### v0.2 架构升级

- **React Navigation** — 页面栈管理，返回时恢复滚动位置
- **Zustand** — 全局状态管理，会话/消息状态同步
- **ApiService** — 统一数据层，前后端格式转换
- **ErrorBoundary** — 错误边界，防止白屏崩溃
- **StorageService** — 本地持久化（AsyncStorage + MMKV）

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
├── src/                        # v0.2 架构源码
│   ├── App.tsx                 # 入口（ErrorBoundary + AppNavigator）
│   ├── navigation/             # React Navigation 配置
│   │   ├── AppNavigator.tsx    # 主导航器
│   │   └── LinkingConfig.ts    # 深度链接配置
│   ├── screens/                # 页面组件（接入 Zustand store）
│   │   ├── HomeScreen.tsx      # 首页
│   │   ├── ConnectionScreen.tsx # 连接管理
│   │   ├── SessionListScreen.tsx # 会话列表
│   │   ├── ChatScreen.tsx      # 聊天界面
│   │   └── HelperScreen.tsx    # 小助理
│   ├── services/               # 服务层
│   │   ├── ApiService.ts       # 统一 API（格式转换）
│   │   └── StorageService.ts   # 本地存储
│   ├── store/                  # Zustand 状态管理
│   │   ├── sessionStore.ts     # 会话状态
│   │   └── messageStore.ts     # 消息状态
│   ├── types/                  # TypeScript 类型定义
│   │   ├── message.ts
│   │   ├── session.ts
│   │   └── connection.ts
│   └── utils/                  # 工具函数
│       └── sessionFilter.ts    # 会话过滤
├── poc/app/                    # React Native 应用（PoC）
├── v3.0-*.md                   # 设计文档
└── README.md
```

## 技术栈

- **框架**: React Native 0.76
- **语言**: TypeScript
- **导航**: React Navigation 7
- **状态管理**: Zustand 5
- **存储**: AsyncStorage + MMKV
- **样式**: StyleSheet（暖色主题）

## 开发阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| W4-W5 | 通信层 + 认证 | ✅ |
| W6 | Markdown 渲染 | ✅ |
| W8-9 | Sidecar 对接 | ✅ |
| W10 | 消息发送 | ✅ |
| W6+ | 消息渲染升级 | ✅ |
| W11 | 小助理 MVP | ✅ |
| v0.2 | 架构升级 | ✅ |
| W12-13 | 测试 + 修复 | ⏳ |

## 测试

```bash
# 运行所有测试
npm test

# 运行 v0.2 架构测试
npx jest src/navigation/__tests__ src/utils/__tests__ src/components/__tests__ src/store/__tests__ src/services/__tests__ --no-coverage
```

## License

MIT License

基于 [MyAgents](https://github.com/hAcKlyc/MyAgents)（Apache 2.0）衍生。
