/**
 * streaming-utils — 流式文本处理工具
 *
 * v0.3 W1 D3：前缀固化策略的核心算法。
 * 参考 OpenOmniBot StreamingText 的 prefix-freeze 模式。
 */

/**
 * 找到最后一个安全的 Markdown 截断边界。
 *
 * 优先级（从高到低）：
 * 1. 代码块保护：未闭合的 ``` 之前截断，避免破坏代码块语法
 * 2. 逐行分析：所有完整行（非最后一行）都是安全的
 *    — 段落（空行作为安全边界）
 *    — 表格行、列表项、标题、普通文本行
 *    — 只有最后一行（正在生成）被排除
 * 3. 最近换行（兜底）
 * 4. 文本末尾（无安全边界）
 *
 * @param text 当前完整文本（含尾部正在生成的部分）
 * @returns 安全的截断位置（字符索引）
 */
export function lastSafeBoundary(text: string): number {
  if (!text) return 0;

  const len = text.length;
  if (len < 5) return len; // 极短文本直接返回全部

  // ── 1. 未闭合代码块保护 ──
  // 如果代码块未闭合（奇数个 ```），回退到第一个 ``` 之前
  const ticks = text.match(/```/g);
  if (ticks && ticks.length % 2 === 1) {
    const firstTick = text.indexOf('```');
    if (firstTick > 0) {
      // 回退到第一个 ``` 之前的段落边界
      const before = text.slice(0, firstTick);
      const lastBreak = before.lastIndexOf('\n\n');
      if (lastBreak > 0) return lastBreak + 2;
      const lastNl = before.lastIndexOf('\n');
      if (lastNl > 0) return lastNl + 1;
      return firstTick; // 退无可退，截在 ``` 之前
    }
  }
  // 代码块完整闭合时，不做特殊处理，交给逐行分析

  // ── 3. 逐行分析：表格行 / 列表项 ──
  // 用逐行扫描代替复杂正则，避免 exec+g 标志的匹配位置问题
  const lines = text.split('\n');
  let cumulativePos = 0;           // 当前行在原文中的起始位置
  let lastCompleteLineEnd = 0;     // 最后一个完整行的结束位置

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = cumulativePos;
    const lineEnd = cumulativePos + line.length + 1; // +1 for the \n separator
    const isLastLine = i === lines.length - 1;
    const isEmptyLine = line.trim() === '';

    // 跳过空行
    if (isEmptyLine) {
      // 空行是安全的截断点
      lastCompleteLineEnd = lineEnd;
      cumulativePos = lineEnd;
      continue;
    }

    // 表格行：| 开头
    if (line.startsWith('|') && !isLastLine) {
      lastCompleteLineEnd = lineEnd;
    }
    // 列表项：- / * / + 开头
    else if (/^[-*+] /.test(line) && !isLastLine) {
      lastCompleteLineEnd = lineEnd;
    }
    // 有序列表：数字. 开头
    else if (/^\d+\. /.test(line) && !isLastLine) {
      lastCompleteLineEnd = lineEnd;
    }
    // 标题：# 开头
    else if (/^#{1,6}\s/.test(line) && !isLastLine) {
      lastCompleteLineEnd = lineEnd;
    }
    // 普通文本行：也是安全的（完成的行）
    else if (!isLastLine) {
      lastCompleteLineEnd = lineEnd;
    }
    // 最后一行（正在生成）：不更新 lastCompleteLineEnd

    cumulativePos = lineEnd;
  }

  if (lastCompleteLineEnd > 0) {
    const ratio = lastCompleteLineEnd / len;
    if (ratio >= 0.3) return lastCompleteLineEnd;
  }

  // ── 2. 最近换行（兜底）──
  const lastNewline = text.lastIndexOf('\n');
  if (lastNewline > 0) {
    const ratio = lastNewline / len;
    if (ratio >= 0.3) {
      return lastNewline + 1;
    }
  }

  // ── 3. 文本末尾（无安全边界）──
  return len;
}

