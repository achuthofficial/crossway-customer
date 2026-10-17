import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

/** Mirror an Animated.Value into React state, for props the native driver can't reach (SVG paths, dash offsets). */
export function useAnimatedNumber(v: Animated.Value): number {
  const [n, setN] = useState<number>(() => (v as any).__getValue?.() ?? 0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(value));
    return () => v.removeListener(id);
  }, [v]);
  return n;
}

export const useValue = (init: number) => useRef(new Animated.Value(init)).current;

/** Fires `fn` when `value` changes after the first render. */
export function useChange<T>(value: T, fn: (prev: T, next: T) => void) {
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) fn(prev.current, value);
    prev.current = value;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
}
