import { useEffect, useState } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '../../design-tokens/tokens';
import { useMotion, ND } from './MotionProvider';

type P = { id: number; angle: number; dist: number; size: number; color: string; spin: number; round: boolean; v: Animated.Value };

/**
 * One-shot brand-colour confetti from a point. A single burst (never repeating), so it
 * stays well under the three-flashes-per-second limit. Skipped entirely with reduced motion.
 */
export function SuccessBurst({ trigger, count = 22, radius = 120, style }: { trigger: unknown; count?: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const m = useMotion();
  const [parts, setParts] = useState<P[]>([]);
  useEffect(() => {
    if (!trigger || m.reduced) return;
    const brand = tokens.color.brand;
    const next = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      dist: radius * (0.55 + Math.random() * 0.6),
      size: 6 + Math.random() * 6,
      color: brand[i % brand.length],
      spin: (Math.random() - 0.5) * 720,
      round: i % 3 === 0,
      v: new Animated.Value(0),
    }));
    setParts(next);
    Animated.parallel(
      next.map(p => Animated.timing(p.v, { toValue: 1, duration: 900 + Math.random() * 300, easing: Easing.bezier(0.05, 0.7, 0.1, 1), useNativeDriver: ND })),
    ).start(() => setParts([]));
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!parts.length) return null;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: 0, height: 0 }, style]}>
      {parts.map(p => {
        const dx = Math.cos(p.angle) * p.dist;
        const dy = Math.sin(p.angle) * p.dist;
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              left: -p.size / 2,
              top: -p.size / 2,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              borderRadius: p.round ? p.size / 2 : 1,
              backgroundColor: p.color,
              opacity: p.v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
                // Rises along its angle, then gravity pulls it down past where it peaked.
                { translateY: p.v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, dy * 0.9, dy + 46] }) },
                { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', p.spin + 'deg'] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
