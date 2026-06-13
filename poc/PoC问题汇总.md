# Phase 0 PoC — 问题汇总

> **记录日期**：2026-06-13  
> **阶段**：W1 渲染 PoC（80%）+ W2 通信 PoC（20%）  
> **截图**：`D:/myagents-android/poc_progress.png`

---

## 一、环境配置问题

### 1.1 Java 版本不兼容
| 项目 | 说明 |
|------|------|
| **问题** | 系统默认 Java 8，RN 0.76+ 要求 Java 17 |
| **表现** | `./gradlew assembleDebug` 报错：不支持的类文件版本 |
| **解决** | 下载安装 Eclipse Temurin JDK 17 到 `D:/Java/jdk-17.0.19+10` |
| **耗时** | ~10 分钟（下载 + 解压） |

### 1.2 Android NDK 缺失
| 项目 | 说明 |
|------|------|
| **问题** | RN 0.76 需要 NDK 26.1.10909125，系统未安装 |
| **表现** | `NDK not configured. Download it with SDK manager` |
| **解决** | `sdkmanager.bat --install "ndk;26.1.10909125"` |
| **耗时** | ~5 分钟 |

### 1.3 中文路径导致 CMake 构建失败
| 项目 | 说明 |
|------|------|
| **问题** | 项目路径 `E:\桌面文件夹\AI练习项目\myagents安卓端` 含中文字符 |
| **表现** | CMake JSON 解析错误：`Invalid escape sequence at line 3 column 20` |
| **原因** | CMake 生成的 `android_gradle_build.json` 中路径被编码为乱码，产生非法 JSON |
| **尝试** | `android.overridePathCheck=true` — 无效 |
| **尝试** | 符号链接 `D:\ma-poc` — 无效（内部路径仍含中文） |
| **解决** | 复制项目到纯英文路径 `D:\myagents-android` |
| **耗时** | ~30 分钟（多次尝试） |

### 1.4 npm 依赖路径缓存
| 项目 | 说明 |
|------|------|
| **问题** | 复制项目后，`autolinking.json` 仍缓存旧路径 |
| **表现** | `this and base files have different roots` 错误 |
| **解决** | 删除 `node_modules` + `android/build` + `android/app/.cxx`，重新 `npm install` + `npx react-native config` |
| **耗时** | ~15 分钟 |

---

## 二、代码 Bug

### 2.1 JSX 语法错误：数字后直接跟标识符
| 项目 | 说明 |
|------|------|
| **文件** | `KaTeXDemo.tsx` 第 128 行、`MermaidDemo.tsx` 第 217 行 |
| **问题** | `3s` 和 `2s` 在 JSX 中被解析为"数字 + 标识符"的非法语法 |
| **表现** | 红屏报错：`SyntaxError: Identifier directly after number` |
| **解决** | 改为 `{'< 3s'}` 和 `{'< 2s'}`（用字符串包裹） |
| **教训** | JSX 中数字后面不能直接跟字母，需要用空格或字符串 |

### 2.2 BashTool 输出不能滚动
| 项目 | 说明 |
|------|------|
| **文件** | `BashToolDemo.tsx` |
| **问题** | `ScrollView` 设为 `horizontal` 且 `maxHeight: 300`，只能水平滚动 |
| **表现** | 1000 行输出只显示 15 行，不能上下滑动 |
| **解决** | 改为嵌套 ScrollView：外层垂直滚动（`maxHeight: 500`），内层水平滚动 |
| **教训** | 终端输出需要双向滚动（垂直看全部 + 水平看长行） |

### 2.3 KaTeX 渲染时间不显示
| 项目 | 说明 |
|------|------|
| **文件** | `KaTeXDemo.tsx` |
| **问题** | `renderTime` 状态定义了但没有更新逻辑 |
| **表现** | 渲染时间一直显示"测量中..." |
| **解决** | 添加 `onReady` 回调，计数 6 个公式全部渲染完成后计算总耗时 |

---

## 三、开发工具问题

### 3.1 VS Code React Native 扩展调试失败
| 项目 | 说明 |
|------|------|
| **问题** | 点击调试按钮报错 `spawn EINVAL (error code 303)` |
| **原因** | 扩展对 RN 0.76 新架构（bridgeless mode）支持不完善 |
| **解决** | 改用 Chrome DevTools + React DevTools |

### 3.2 Chrome DevTools 无 Elements 面板
| 项目 | 说明 |
|------|------|
| **问题** | 用 Chrome 调试时没有 HTML 元素检查功能 |
| **原因** | React Native 不使用 DOM，Elements 面板无意义 |
| **解决** | 用 React DevTools 的 Components 面板替代 |

### 3.3 React DevTools Electron 安装失败
| 项目 | 说明 |
|------|------|
| **问题** | `npx react-devtools` 报错：Electron failed to install |
| **解决** | 改用 Chrome 扩展版 React Developer Tools + 手机菜单 "Open DevTools" |

### 3.4 jest.config.js 配置项名错误
| 项目 | 说明 |
|------|------|
| **问题** | 使用了不存在的配置项 `setupFilesAfterSetup` |
| **正确** | 应为 `setupFiles`（测试框架安装前运行）或 `setupFilesAfterFramework`（安装后运行） |
| **解决** | 改为 `setupFiles` |

### 3.5 node_modules 误提交到 Git
| 项目 | 说明 |
|------|------|
| **问题** | `npm install` 后 `git add -A` 把 node_modules 提交了（6239 个文件，100 万行） |
| **原因** | 项目没有 `.gitignore` 文件 |
| **解决** | 添加 `.gitignore` + `git rm -r --cached node_modules/` |

### 3.6 RN init 创建独立 .git 仓库
| 项目 | 说明 |
|------|------|
| **问题** | `npx react-native init` 在 `poc/app/` 下自动创建了 `.git`，导致它变成独立仓库 |
| **解决** | 删除 `poc/app/.git`，合并到主仓库 |

---

## 四、文档设计问题

### 4.1 SSE 事件数量多次修正
| 次数 | 文档声称 | 实际源码 |
|------|---------|---------|
| 第 1 次 | 13 个事件 | 50+ 个 |
| 第 2 次 | 49 个事件 | 52 个（SSE_EVENT_PRIORITIES） |
| 第 3 次 | 41 个 critical | 41 个（源码确认） |

### 4.2 工具组件清单多次修正
| 次数 | 文档声称 | 实际源码 |
|------|---------|---------|
| 第 1 次 | 17 个可复用 | 不存在 TaskCreateTool 等文件 |
| 第 2 次 | 12 个可直接适配 | 实际是 9 个（TaskTodoTool 统一处理 4 种） |
| 第 3 次 | 18 个 Tool.tsx | 源码确认 18 个 |

### 4.3 Sidecar 绑定地址方案矛盾
| 文档 | 方案 |
|------|------|
| 概要设计 | 新增独立 HTTP 服务 |
| 详细设计 | 直接修改 hostname |

**已修正**：统一为独立 HTTP 服务方案。

### 4.4 推送通知方案可行性不足
| 问题 | 说明 |
|------|------|
| 本地通知 | App 后台 SSE 断开，无法收到新事件 |
| 实际价值 | 仅"前台收到事件 → 切后台"瞬间有效 |

**已修正**：降级为 P3，补充 Webhook 回调方案。

---

## 五、性能问题

### 5.1 APK 体积偏大
| 项目 | 数据 |
|------|------|
| Debug APK | 108MB |
| 原因 | 包含 JS Bundle + 原生库 + 调试符号 |
| 预期 Release | ~35MB（ProGuard + 代码拆分） |

### 5.2 首次构建耗时长
| 项目 | 数据 |
|------|------|
| `./gradlew assembleDebug` | 首次 ~3 分钟，增量 ~30 秒 |
| `npm install` | ~40 秒 |
| Metro Bundle | ~5 秒 |

---

## 六、已解决但需注意

| 问题 | 注意事项 |
|------|---------|
| 环境变量不持久 | 每次新终端需重新设置 `JAVA_HOME`、`ANDROID_HOME` |
| Metro 需要端口转发 | 每次连接手机需 `adb reverse tcp:8081 tcp:8081` |
| Bundle 语法错误不明显 | Metro 不报错，只有手机红屏，需 curl 测试 bundle |
| App 缓存导致白屏 | `pm clear com.myagentscompanion` 清除数据后重启 |

---

**截图位置**：`D:/myagents-android/poc_progress.png`
