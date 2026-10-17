import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import { useMotion } from './MotionProvider';

/**
 * FLIP list for re-ordering (e.g. a leaderboard). Rows are laid out at fixed heights and each
 * slides to its new slot with a spatial spring when the order changes: transform only, so a
 * re-sort never triggers layout. Rows that move up rise above the others while travelling.
 */
export function FlipList<T>({ items, keyOf, rowHeight, renderRow }: { items: T[]; keyOf: (t: T) => string; rowHeight: number; renderRow: (t: T, index: number) => ReactNode }) {
  const m = useMotion();
  const ys = useRef(new Map<string, Animated.Value>()).current;
  const prevIdx = useRef(new Map<string, number>()).current;
  items.forEach((it, i) => {
    const k = keyOf(it);
    if (!ys.has(k)) ys.set(k, new Animated.Value(i * rowHeight));
  });
  useEffect(() => {
    items.forEach((it, i) => {
      const k = keyOf(it);
      m.to(ys.get(k)!, i * rowHeight, { speed: 'default' }).start();
      prevIdx.set(k, i);
    });
  }, [items.map(keyOf).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ height: items.length * rowHeight }} accessibilityRole="list">
      {items.map((it, i) => {
        const k = keyOf(it);
        const rising = (prevIdx.get(k) ?? i) > i;
        return (
          <Animated.View key={k} style={{ position: 'absolute', left: 0, right: 0, height: rowHeight, zIndex: rising ? 2 : 1, transform: [{ translateY: ys.get(k)! }] }}>
            {renderRow(it, i)}
          </Animated.View>
        );
      })}
    </View>
  );
}
