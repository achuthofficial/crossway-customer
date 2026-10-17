import { useEffect, useRef, useState } from 'react';
import { Animated, Text, type StyleProp, type TextStyle } from 'react-native';
import { useMotion } from './MotionProvider';

/** Counts from the previous value to `value` (emphasized decelerate, 700 ms). */
export function CountUp({ value, format = String, style }: { value: number; format?: (n: number) => string; style?: StyleProp<TextStyle> }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(value)).current;
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const id = v.addListener(({ value: x }) => setShown(x));
    m.tween(v, value, 700, { native: false }).start();
    return () => v.removeListener(id);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Text style={style} accessibilityLabel={format(value)}>{format(shown)}</Text>;
}
