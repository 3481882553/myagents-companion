/**
 * 深度链接配置
 * v0.2 架构升级 — React Navigation
 */

export const linking = {
  prefixes: ['myagents://'],
  config: {
    screens: {
      Home: '',
      Connection: 'connect',
      SessionList: 'sessions',
      Chat: 'chat/:sessionId',
      Helper: 'helper',
    },
  },
};
