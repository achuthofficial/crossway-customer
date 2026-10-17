import { useEffect, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useMotion } from './MotionProvider';
import { useAnimatedNumber, useChange, useValue } from './hooks';
import { haptics } from './haptics';

const MILESTONES = [0.25, 0.5, 0.75, 1];

/**
 * Circular progress that fills with a slow spatial spring and pulses once each time it
 * crosses a milestone (25/50/75/100 %), with a haptic tick (success at 100 %).
 */
export function ProgressRing({ value, size = 88, stroke = 8, color = '#0B57D0', track = '#E1E3E1', children, label }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label?: string }) {
  const m = useMotion();
  const v = useValue(0);
  const pulse = useValue(1);
  const n = useAnimatedNumber(v);
  useEffect(() => {
    m.to(v, value, { native: false, speed: 'slow' }).start();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useChange(value, (prev, next) => {
    const hit = MILESTONES.find(ms => prev < ms && next >= ms);
    if (hit === undefined) return;
    hit === 1 ? haptics.success() : haptics.tick();
    if (m.reduced) return;
    Animated.sequence([m.to(pulse, 1.12, { speed: 'fast' }), m.to(pulse, 1, { speed: 'default' })]).start();
  });
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1.02, n));
  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse }] }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - shown)} />
      </Svg>
      <View>{children}</View>
    </Animated.View>
  );
}
