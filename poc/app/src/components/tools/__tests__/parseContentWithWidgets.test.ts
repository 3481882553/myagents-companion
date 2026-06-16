/**
 * parseContentWithWidgets 单元测试
 */

// 内联函数测试（从 ChatScreen 提取）
function parseContentWithWidgets(content: string): { type: 'text' | 'widget'; value: string }[] {
  if (!content) return [];
  const segments: { type: 'text' | 'widget'; value: string }[] = [];
  const regex = /<generative-ui-widget[^>]*>([\s\S]*?)<\/generative-ui-widget>/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'widget', value: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return segments;
}

describe('parseContentWithWidgets', () => {
  it('纯文本无 Widget', () => {
    const result = parseContentWithWidgets('Hello World');
    expect(result).toEqual([{ type: 'text', value: 'Hello World' }]);
  });

  it('单个 Widget', () => {
    const html = '<generative-ui-widget><div>chart</div></generative-ui-widget>';
    const result = parseContentWithWidgets(html);
    expect(result).toEqual([{ type: 'widget', value: '<div>chart</div>' }]);
  });

  it('Widget 前后有文本', () => {
    const html = '看图表：<generative-ui-widget><div>chart</div></generative-ui-widget>完毕';
    const result = parseContentWithWidgets(html);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', value: '看图表：' });
    expect(result[1]).toEqual({ type: 'widget', value: '<div>chart</div>' });
    expect(result[2]).toEqual({ type: 'text', value: '完毕' });
  });

  it('多个 Widget', () => {
    const html = '图表1：<generative-ui-widget><div>chart1</div></generative-ui-widget>中间图表2：<generative-ui-widget><div>chart2</div></generative-ui-widget>结尾';
    const result = parseContentWithWidgets(html);
    expect(result).toHaveLength(5);
    expect(result.filter(s => s.type === 'widget')).toHaveLength(2);
  });

  it('空内容', () => {
    expect(parseContentWithWidgets('')).toEqual([]);
    expect(parseContentWithWidgets(null as any)).toEqual([]);
  });
});
