import { Children, isValidElement, useEffect, type ReactNode } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useMotion } from './MotionProvider';
import { useValue } from './hooks';

type Props = { index?: number; style?: StyleProp<ViewStyle>; children?: ReactNode; onPress?: () => void; accessibilityLabel?: string };

/**
 * Card that enters with a staggered spring (rise + settle) and presses down on touch.
 * Opacity uses an effects spring (no overshoot); position and scale use spatial springs.
 */
export function AnimatedCard({ index = 0, style, children, onPress, accessibilityLabel }: Props) {
  const m = useMotion();
  const enter = useValue(0);
  const fade = useValue(0);
  const press = useValue(1);
  useEffect(() => {
    const delay = m.stagger(index);
    m.to(enter, 1, { delay }).start();
    m.to(fade, 1, { kind: 'effects', delay }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const body = (
    <Animated.View
      style={[
        style,
        {
          opacity: fade,
          transform: m.reduced
            ? []
            : [
                { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                { scale: Animated.multiply(enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }), press) },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => m.to(press, 0.97, { speed: 'fast' }).start()}
      onPressOut={() => m.to(press, 1, { speed: 'fast' }).start()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Pressable>
  );
}

/** Staggers its children's entrance, 40 ms apart, capped at 8. */
export function StaggerList({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  let i = 0;
  return (
    <Animated.View style={style}>
      {Children.map(children, c => (isValidElement(c) ? <AnimatedCard index={i++}>{c}</AnimatedCard> : c))}
    </Animated.View>
  );
}
