/**
 * 设计 Token — 与桌面端暖色主题对齐
 *
 * 亮色模式：Warm Paper
 * 暗色模式：Warm Night
 */

export const lightTokens = {
  // 背景色
  paper: '#faf6ee',
  paperElevated: '#fffcf7',
  paperInset: '#e8dccf',

  // 文字色
  ink: '#1c1612',
  inkSecondary: '#2e2825',
  inkMuted: '#6f6156',

  // 强调色
  accentWarm: '#c26d3a',
  accentCool: '#2e6f5e',

  // 边框
  line: 'rgba(28, 22, 18, 0.10)',
  lineStrong: 'rgba(28, 22, 18, 0.18)',

  // 代码
  codeBg: '#1e1e1e',
  codeHeaderBg: '#2d2d2d',

  // 语义色
  success: '#22c55e',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const darkTokens = {
  // 背景色
  paper: '#1a1614',
  paperElevated: '#242018',
  paperInset: '#12100e',

  // 文字色
  ink: '#e4dcd4',
  inkSecondary: '#cfc5ba',
  inkMuted: '#968a7e',

  // 强调色
  accentWarm: '#d4803f',
  accentCool: '#3a8b74',

  // 边框
  line: 'rgba(228, 220, 212, 0.10)',
  lineStrong: 'rgba(228, 220, 212, 0.18)',

  // 代码
  codeBg: '#141210',
  codeHeaderBg: '#1e1a16',

  // 语义色
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',
};

export type ThemeTokens = typeof lightTokens;
