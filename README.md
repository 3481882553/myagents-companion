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
- **Zustand** — 全局状态管理，会话/消息/连接状态同步
- **ApiService** — 统一数据层，前后端格式转换
- **ErrorBoundary** — 错误边界，防止白屏崩溃
- **StorageService** — 本地持久化（AsyncStorage + MMKV）
- **调试日志** — 全链路 console.log，TAG 过滤

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
cd android && ./gradlew.bat app:installDebug -PreactNativeDevServerPort=8081

# 4. 设置 ADB 端口转发（USB 连接必须）
adb reverse tcp:8081 tcp:8081
adb reverse tcp:32107 tcp:32107
```

### 连接桌面端

在 App 连接页面输入：

| 字段 | USB 连接 | WiFi 连接 |
|------|---------|-----------|
| IP 地址 | `localhost` | 电脑局域网 IP |
| 端口 | `32107` | `32107` |
| 配对码 | 桌面端设定的 | 桌面端设定的 |

### 查看调试日志

```bash
# 实时查看所有 JS 日志
adb logcat -s ReactNativeJS:V

# 过滤特定模块
adb logcat -s ReactNativeJS:V | grep "\[ChatScreen\]"
adb logcat -s ReactNativeJS:V | grep "\[connectionStore\]"
adb logcat -s ReactNativeJS:V | grep "\[ApiService\]"

# 排除其他 App 干扰
adb logcat -s ReactNativeJS:V | grep -v "kugou\|qq\.com\|music"
```

### Release 模式

```bash
cd poc/app/android && ./gradlew.bat app:installRelease
```

## 项目结构（v0.2 final）

```
D:\myagents-android\
├── poc/app/                          ← React Native 项目（唯一代码目录）
│   ├── index.js                      ← 入口
│   ├── App.tsx                       ← ErrorBoundary 包裹
│   ├── metro.config.js               ← Metro 配置（简洁无 watchFolders）
│   └── src/
│       ├── components/               ← ErrorBoundary + markdown + tools + PoC 验证
│       ├── navigation/               ← React Navigation + Linking 配置
│       ├── screens/                  ← Home / Connection / SessionList / Chat / Helper
│       ├── services/                 ← ApiService / StorageService / 通信 / 认证 / 日志
│       ├── store/                    ← Zustand（connectionStore / sessionStore / messageStore）
│       ├── types/                    ← TypeScript 接口（Message / Session / Connection）
│       ├── utils/                    ← sessionFilter / connectionStorage
│       ├── hooks/                    ← useDeepLink 等
│       ├── db/                       ← SQLite 消息缓存
│       ├── server/                   ← 服务端中间件（JWT 等）
│       ├── theme/                    ← 设计 Token + 主题
│       └── __tests__/                ← mock 文件 + setup
├── jest.config.js                    ← Jest 配置
├── tsconfig.json                     ← TypeScript 配置
├── v3.0-MVP执行计划.md               ← MVP 开发计划
├── v0.2-架构升级方案.md              ← 架构设计文档
└── v0.2-问题诊断报告.md              ← 问题诊断与修复记录
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
| v0.2 | 架构升级 + 代码合并 + 测试修复 | ✅ |
| W12-13 | 测试 + 修复 | ⏳ |

## 测试

```bash
# 运行所有测试
cd D:/myagents-android
npx jest --no-coverage

# 运行核心模块
npx jest poc/app/src/store poc/app/src/services poc/app/src/utils --no-coverage
```

当前测试状态：26 套件通过，208 用例通过。

## License

MIT License

基于 [MyAgents](https://github.com/hAcKlyc/MyAgents)（Apache 2.0）衍生。
