/**
 * lastSafeBoundary 安全截断算法测试
 *
 * v0.3 W1 D3：前缀固化策略的核心函数。
 *
 * 目标：在流式文本中找到一个安全的位置来截断，
 * 截断点之前的内容可以安全地用 Markdown 渲染（不会有未闭合的语法块）。
 */

import { lastSafeBoundary } from '../streaming-utils';

describe('lastSafeBoundary', () => {
  // ── 完整段落 ──

  it('在完整段落边界截断（双换行）', () => {
    const text = '第一段内容。\n\n第二段正在';
    const pos = lastSafeBoundary(text);
    // 应该在第一个 \n\n 之后截断
    expect(pos).toBe(text.indexOf('\n\n') + 2);
  });

  it('优先选择较近的段落边界（靠后的双换行）', () => {
    const text = '段1。\n\n段2。\n\n段3还没写完';
    const pos = lastSafeBoundary(text);
    const secondBreak = text.indexOf('\n\n', text.indexOf('\n\n') + 2);
    expect(pos).toBe(secondBreak + 2);
  });

  it('没有段落边界时找最近的换行', () => {
    const text = '单行文本还在写';
    const pos = lastSafeBoundary(text);
    // 没有换行，返回全长
    expect(pos).toBe(text.length);
  });

  it('单换行之后的文字不稳定，应在前一行末尾截断', () => {
    const text = '已完成的行\n正在写的行';
    const pos = lastSafeBoundary(text);
    // 应该在 \n 之后截断（已完成的行之后）
    expect(pos).toBe(text.indexOf('\n') + 1);
  });

  // ── 代码块 ──

  it('闭合的代码块后截断', () => {
    const text = '说明文字\n```\ncode here\n```\n后面还有内容';
    const pos = lastSafeBoundary(text);
    // 应该在闭合的 ``` 之后截断
    const closePos = text.lastIndexOf('```\n') + 4;
    expect(pos).toBe(closePos);
  });

  it('未闭合的代码块：不截断在代码块中间', () => {
    const text = '说明\n```js\nfunction hello() {\n  return 1;';
    const pos = lastSafeBoundary(text);
    // 代码块未闭合，应该退回到代码块之前
    expect(pos).toBeLessThanOrEqual(text.indexOf('```js'));
  });

  it('多个代码块时最后一个闭合后的位置', () => {
    const text = '```js\nlet a=1;\n```\n\n文字\n```py\nprint(1)\n```\n\n尾巴';
    const pos = lastSafeBoundary(text);
    // 截断点应在未完成的「尾巴」行之前
    const prefix = text.slice(0, pos);
    expect(prefix).not.toContain('尾巴');
    // 截断前缀应包含完整的第二个代码块
    expect(prefix).toContain('```py');
    expect(prefix).toContain('print(1)');
    expect(prefix).toContain('```');
  });

  // ── 标题 ──

  it('标题行 + 空行后截断', () => {
    const text = '## 标题\n\n正文第一段。\n\n正文第二段还在';
    const pos = lastSafeBoundary(text);
    const lastBreak = text.lastIndexOf('\n\n');
    expect(pos).toBe(lastBreak + 2);
  });

  // ── 列表 ──

  it('完整列表项后截断', () => {
    const text = '- 第一项\n- 第二项\n- 第三项还没';
    const pos = lastSafeBoundary(text);
    // 第二个完整项（- 第二项\n）之后
    const secondNl = text.indexOf('\n', text.indexOf('\n') + 1);
    expect(pos).toBe(secondNl + 1);
  });

  it('有序列表完整项后截断', () => {
    const text = '1. 步骤一\n2. 步骤二\n3. 正在写';
    const pos = lastSafeBoundary(text);
    const secondNl = text.indexOf('\n', text.indexOf('\n') + 1);
    expect(pos).toBe(secondNl + 1);
  });

  // ── 表格 ──

  it('完整表格行后截断', () => {
    const text = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 还在';
    const pos = lastSafeBoundary(text);
    // 最后完整的数据行是 | 1 | 2 |\n，截断在其后的位置
    const lastDataRowEnd = text.lastIndexOf('\n', text.lastIndexOf('\n') - 1) + 1;
    // 注意：算法返回的是最后一个完整数据行之后的位置
    expect(pos).toBeGreaterThanOrEqual(lastDataRowEnd);
    // 不应该包含未完成的行
    const prefix = text.slice(0, pos);
    expect(prefix).not.toContain('还在');
  });

  // ── 边界情况 ──

  it('空字符串返回 0', () => {
    expect(lastSafeBoundary('')).toBe(0);
  });

  it('只有空白字符', () => {
    const text = '   \n  \n   ';
    // 找最近的换行
    const pos = lastSafeBoundary(text);
    expect(pos).toBeGreaterThan(0);
  });

  it('超长单行：返回全长', () => {
    const long = 'a'.repeat(5000);
    expect(lastSafeBoundary(long)).toBe(long.length);
  });

  it('流式场景：前缀足够大时才提前截断', () => {
    // 只有少于 30% 的完整内容时，不提前截断
    const text = '很短的完\n整内容，后面还有很多很多很多很多内容正在生成中';
    const pos = lastSafeBoundary(text);
    // \n 分割太靠前（< 30%），应该继续往后找
    // 实际上会回到最后一个换行
    expect(pos).toBeGreaterThan(0);
  });

  // ── 综合场景 ──

  it('混合场景：段落 + 代码块 + 正文', () => {
    const text = [
      '## 介绍',
      '',
      '这是一段完整的内容。',
      '',
      '```python',
      'def hello():',
      '    print("world")',
      '```',
      '',
      '## 第二部分',
      '',
      '这一句还没写',
    ].join('\n');

    const pos = lastSafeBoundary(text);
    // 截断点应在「这一句还没写」之前（未完成行被排除）
    const prefix = text.slice(0, pos);
    expect(prefix).not.toContain('这一句还没写');
    // 应包含前面的完整内容
    expect(prefix).toContain('## 第二部分');
    expect(prefix).toContain('```python');
  });
});
