/**
 * sanitize — HTML 安全过滤
 *
 * v0.4 W2：Widget 渲染安全过滤
 * 与桌面端 WidgetRenderer 的 sanitizeForStreaming() 对齐
 */

/**
 * 过滤 Widget HTML 中的危险内容
 *
 * 安全策略（纵深防御）：
 * 1. 移除 <script> 标签（含嵌套）
 * 2. 移除 on* 事件属性（onclick, onerror 等）
 * 3. 移除 javascript: 协议
 * 4. 保留正常 HTML/CSS/内容
 */
export function sanitizeWidgetHtml(html: string): string {
  let result = html;

  // 移除所有 <script>...</script> 标签（包括嵌套）
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 移除 on* 事件属性（前面可能有空格，后面跟引号包裹的值）
  result = result.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');

  // 移除 javascript: 协议
  result = result.replace(/javascript:/gi, 'void:');

  return result;
}
