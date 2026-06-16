/**
 * WidgetRenderer 单元测试
 *
 * v0.4 W2：WebView 沙箱渲染 AI 生成的交互式 Widget
 *
 * 测试策略：纯逻辑函数测试 + 组件冒烟测试（不渲染 WebView）
 */

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s, absoluteFillObject: {} },
  View: 'View',
  Text: 'Text',
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity',
  Linking: { openURL: jest.fn() },
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// ── sanitize 函数测试 ──
import { sanitizeWidgetHtml } from '../../../utils/sanitize';

describe('sanitizeWidgetHtml', () => {
  it('移除 <script> 标签', () => {
    const html = '<div>hello</div><script>alert("xss")</script>';
    const result = sanitizeWidgetHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<div>hello</div>');
  });

  it('移除 on* 事件属性', () => {
    const html = '<button onclick="alert(1)">click</button>';
    const result = sanitizeWidgetHtml(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('<button>click</button>');
  });

  it('移除 javascript: 协议', () => {
    const html = '<a href="javascript:void(0)">link</a>';
    const result = sanitizeWidgetHtml(html);
    expect(result).not.toContain('javascript:');
    // javascript: 被替换为 void:
    expect(result).toContain('void:');
  });

  it('保留正常 HTML', () => {
    const html = '<div class="chart"><h2>Title</h2><p>Content</p></div>';
    const result = sanitizeWidgetHtml(html);
    expect(result).toContain('<div class="chart">');
    expect(result).toContain('<h2>Title</h2>');
    expect(result).toContain('<p>Content</p>');
  });

  it('保留 CSS style 标签', () => {
    const html = '<style>.red{color:red}</style><div class="red">hi</div>';
    const result = sanitizeWidgetHtml(html);
    expect(result).toContain('<style>');
    expect(result).toContain('<div class="red">');
  });

  it('多层嵌套 script 也移除', () => {
    const html = '<div><script>/* comment */</script>safe</div>';
    const result = sanitizeWidgetHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).toContain('safe');
  });
});

// ── WidgetRenderer 组件冒烟测试 ──
describe('WidgetRenderer 组件', () => {
  it('模块可导入', () => {
    // 验证组件文件可以被正确解析（无语法错误）
    const mod = require('../WidgetRenderer');
    expect(mod.WidgetRenderer).toBeDefined();
    expect(typeof mod.WidgetRenderer).toBe('function');
  });
});
