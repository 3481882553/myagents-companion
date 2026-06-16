/**
 * useTheme — 主题切换 Hook
 *
 * v0.3 W3：将已实现的 tokens 接入全部组件。
 *
 * 用法：
 *   const { tokens, isDark } = useTheme();
 *   <View style={{ backgroundColor: tokens.paper }} />
 */

import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens } from './tokens';
import type { lightTokens as LightTokens } from './tokens';

type ThemeTokens = typeof LightTokens;

export interface ThemeState {
  tokens: ThemeTokens;
  isDark: boolean;
}

/**
 * 获取当前主题 tokens。
 * 优先跟随系统设置，后续可扩展手动覆盖。
 */
export function useTheme(): ThemeState {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    tokens: isDark ? darkTokens : lightTokens,
    isDark,
  };
}

/** 非 Hook 版本（用于非组件上下文） */
export function getThemeTokens(dark: boolean): ThemeTokens {
  return dark ? darkTokens : lightTokens;
}
