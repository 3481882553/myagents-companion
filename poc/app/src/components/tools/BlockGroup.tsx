/**
 * BlockGroup — 相邻工具调用分组容器
 *
 * v0.3 W2：与桌面端 groupBlocks() 对齐的分组逻辑。
 *
 * 规则：
 * 1. 相邻的 thinking / tool_use 块归为一组
 * 2. 组内 ≥6 个块时，默认折叠中间块
 * 3. 组外不折叠
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface BlockGroupProps {
  /** 子元素（ProcessRow 列表） */
  children: React.ReactNode;
  /** 子元素数量 */
  count: number;
}

/** 分组阈值：超过此数量时，中间块默认折叠 */
const COLLAPSE_THRESHOLD = 6;
/** 折叠时显示的头部/尾部数量 */
const HEAD_TAIL_COUNT = 2;

export function BlockGroup({ children, count }: BlockGroupProps) {
  const [collapsed, setCollapsed] = useState(count >= COLLAPSE_THRESHOLD);

  if (count < COLLAPSE_THRESHOLD) {
    return <View style={styles.container}>{children}</View>;
  }

  const childArray = React.Children.toArray(children);
  const head = childArray.slice(0, HEAD_TAIL_COUNT);
  const tail = childArray.slice(-HEAD_TAIL_COUNT);
  const hiddenCount = count - HEAD_TAIL_COUNT * 2;

  return (
    <View style={styles.container}>
      {head}

      {collapsed && hiddenCount > 0 ? (
        <TouchableOpacity
          testID="block-group-toggle"
          onPress={() => setCollapsed(false)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>
            ▼ 展开中间 {hiddenCount} 个步骤
          </Text>
        </TouchableOpacity>
      ) : (
        childArray.slice(HEAD_TAIL_COUNT, -HEAD_TAIL_COUNT)
      )}

      {tail}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  toggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(28, 22, 18, 0.03)',
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 2,
  },
  toggleText: {
    fontSize: 12,
    color: '#6f6156',
    fontStyle: 'italic',
  },
});
