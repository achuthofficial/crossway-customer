import { useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMotion } from './MotionProvider';
import { useAnimatedNumber, useValue } from './hooks';
import { LOADING_SEQUENCE, lerp, pathAround, rotateRadii, shapeRadii } from './geometry';

/**
 * M3 Expressive loading indicator: cycles cookie → clover → pill → burst → squircle,
 * turning a little with each morph. Runs only while `playing`; reduced motion shows a still shape.
 */
export function ShapeMorph({ size = 40, color = '#0B57D0', playing = true, accessibilityLabel = 'Loading' }: { size?: number; color?: string; playing?: boolean; accessibilityLabel?: string }) {
  const m = useMotion();
  const t = useValue(0);
  const n = useAnimatedNumber(t);
  useEffect(() => {
    if (!playing || m.reduced) return;
    t.setValue(0);
    const steps = LOADING_SEQUENCE.length;
    // Each step is a spring-like ease (emphasized decelerate) so shapes settle before the next morph.
    const loop = Animated.loop(
      Animated.sequence(
        Array.from({ length: steps }, (_, i) =>
          Animated.timing(t, { toValue: i + 1, duration: 650, easing: Easing.bezier(0.05, 0.7, 0.1, 1), useNativeDriver: false }),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, m.reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = LOADING_SEQUENCE.length;
  const i = Math.floor(n) % steps;
  const f = n - Math.floor(n);
  const r = size / 2 - 1;
  const a = shapeRadii(LOADING_SEQUENCE[i], r);
  const b = shapeRadii(LOADING_SEQUENCE[(i + 1) % steps], r);
  const d = pathAround(rotateRadii(lerp(a, b, f), n * (Math.PI / 4)), size / 2, size / 2);
  return (
    <Svg width={size} height={size} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
      <Path d={d} fill={color} />
    </Svg>
  );
}
