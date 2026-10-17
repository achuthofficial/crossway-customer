import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useMotion } from './MotionProvider';
import { haptics } from './haptics';

/**
 * Badge unlock: the locked face turns over in 3D (rotateY with perspective) to show the
 * earned badge, then a single shine sweeps across it. Reduced motion: cross-fade, no shine.
 */
export function BadgeFlip({ unlocked, onUnlock, front, back, width = 160, height = 180 }: { unlocked: boolean; onUnlock?: () => void; front: ReactNode; back: ReactNode; width?: number; height?: number }) {
  const m = useMotion();
  const flip = useRef(new Animated.Value(unlocked ? 1 : 0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const [shining, setShining] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!unlocked) return flip.setValue(0);
    haptics.success();
    m.to(flip, 1, { speed: 'slow' }).start(() => {
      if (m.reduced) return;
      setShining(true);
      shine.setValue(0);
      m.tween(shine, 1, 650, { easing: 'standard' }).start(() => setShining(false));
    });
  }, [unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const face = { position: 'absolute' as const, left: 0, top: 0, width, height, borderRadius: 24, overflow: 'hidden' as const, backfaceVisibility: 'hidden' as const };
  const frontStyle = m.reduced
    ? { opacity: flip.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
    : { transform: [{ perspective: 800 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] };
  const backStyle = m.reduced
    ? { opacity: flip }
    : { transform: [{ perspective: 800 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] }) }] };

  return (
    <Pressable
      onPress={unlocked ? undefined : onUnlock}
      accessibilityRole="button"
      accessibilityLabel={unlocked ? 'Badge unlocked' : 'Locked badge. Tap to reveal'}
      style={{ width, height }}
    >
      <Animated.View style={[face, frontStyle]}>{front}</Animated.View>
      <Animated.View style={[face, backStyle]}>
        {back}
        {shining && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute', top: -20, bottom: -20, width: 44, backgroundColor: 'rgba(255,255,255,.55)',
              transform: [{ translateX: shine.interpolate({ inputRange: [0, 1], outputRange: [-60, width + 20] }) }, { rotate: '18deg' }],
            }}
          />
        )}
      </Animated.View>
      <View />
    </Pressable>
  );
}
