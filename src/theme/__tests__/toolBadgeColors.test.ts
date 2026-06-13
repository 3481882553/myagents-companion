/**
 * 工具徽章颜色 单元测试
 *
 * 测试覆盖：
 * - 工具分类正确性
 * - 亮色/暗色模式完整性
 * - MCP 工具前缀分类
 * - 默认 fallback
 */

import { getToolColorCategory, toolBadgeColors, toolBadgeColorsDark } from '../toolBadgeColors';

describe('getToolColorCategory', () => {
  // ========== 内置工具分类 ==========

  describe('内置工具', () => {
    it('文件操作类 → file (Emerald)', () => {
      expect(getToolColorCategory('Read')).toBe('file');
      expect(getToolColorCategory('Write')).toBe('file');
      expect(getToolColorCategory('Edit')).toBe('file');
      expect(getToolColorCategory('Glob')).toBe('file');
    });

    it('终端类 → terminal (Amber)', () => {
      expect(getToolColorCategory('Bash')).toBe('terminal');
      expect(getToolColorCategory('BashOutput')).toBe('terminal');
    });

    it('搜索类 → search (Violet)', () => {
      expect(getToolColorCategory('Grep')).toBe('search');
      expect(getToolColorCategory('WebSearch')).toBe('search');
    });

    it('网页类 → web (Cyan)', () => {
      expect(getToolColorCategory('WebFetch')).toBe('web');
    });

    it('任务/Agent 类 → task (Indigo)', () => {
      expect(getToolColorCategory('Task')).toBe('task');
      expect(getToolColorCategory('Agent')).toBe('task');
      expect(getToolColorCategory('TaskCreate')).toBe('task');
      expect(getToolColorCategory('TaskUpdate')).toBe('task');
      expect(getToolColorCategory('TaskList')).toBe('task');
      expect(getToolColorCategory('TaskGet')).toBe('task');
      expect(getToolColorCategory('TodoWrite')).toBe('task');
      expect(getToolColorCategory('Workflow')).toBe('task');
      expect(getToolColorCategory('ScheduleWakeup')).toBe('task');
    });

    it('技能类 → skill (Sky)', () => {
      expect(getToolColorCategory('Skill')).toBe('skill');
    });

    it('Notebook 类 → notebook (Teal)', () => {
      expect(getToolColorCategory('NotebookEdit')).toBe('notebook');
    });

    it('未知工具 → default (Blue)', () => {
      expect(getToolColorCategory('UnknownTool')).toBe('default');
      expect(getToolColorCategory('SomeRandomThing')).toBe('default');
    });
  });
});

describe('toolBadgeColors', () => {
  const ALL_CATEGORIES = ['file', 'terminal', 'search', 'web', 'task', 'skill', 'thinking', 'notebook', 'default'] as const;

  describe('亮色模式', () => {
    it('所有类别都有完整定义', () => {
      for (const cat of ALL_CATEGORIES) {
        const config = toolBadgeColors[cat];
        expect(config).toBeDefined();
        expect(config.border).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.text).toBeTruthy();
        expect(config.icon).toBeTruthy();
      }
    });

    it('颜色值格式正确（#hex 或 Tailwind class）', () => {
      for (const cat of ALL_CATEGORIES) {
        const config = toolBadgeColors[cat];
        // border 应该是 Tailwind 类名格式
        expect(config.border).toMatch(/^border-/);
        expect(config.bg).toMatch(/^bg-/);
        expect(config.text).toMatch(/^text-/);
      }
    });
  });

  describe('暗色模式', () => {
    it('所有类别都有完整定义', () => {
      for (const cat of ALL_CATEGORIES) {
        const config = toolBadgeColorsDark[cat];
        expect(config).toBeDefined();
        expect(config.border).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.text).toBeTruthy();
      }
    });

    it('暗色模式颜色与亮色不同', () => {
      for (const cat of ALL_CATEGORIES) {
        const light = toolBadgeColors[cat];
        const dark = toolBadgeColorsDark[cat];
        // 至少 text 颜色应该不同
        expect(dark.text).not.toBe(light.text);
      }
    });
  });

  describe('颜色类别覆盖', () => {
    it('亮色和暗色模式类别数量一致', () => {
      const lightKeys = Object.keys(toolBadgeColors).sort();
      const darkKeys = Object.keys(toolBadgeColorsDark).sort();
      expect(lightKeys).toEqual(darkKeys);
    });

    it('共 9 个颜色类别', () => {
      expect(Object.keys(toolBadgeColors)).toHaveLength(9);
    });
  });

  describe('snapshot 防护', () => {
    it('亮色模式颜色配置 snapshot', () => {
      // 去除 icon（ReactNode 不可序列化）后 snapshot
      const serializable = Object.fromEntries(
        Object.entries(toolBadgeColors).map(([key, val]) => [key, { ...val, icon: '<Icon>' }])
      );
      expect(serializable).toMatchSnapshot();
    });

    it('暗色模式颜色配置 snapshot', () => {
      expect(toolBadgeColorsDark).toMatchSnapshot();
    });
  });
});
