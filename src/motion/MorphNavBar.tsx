import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMotion } from './MotionProvider';
import { haptics } from './haptics';

export type NavItem = { id: string; icon: string; label: string };

const PILL_W = 64;

function NavIcon({ icon, on, color, activeColor }: { icon: string; on: boolean; color: string; activeColor: string }) {
  const m = useMotion();
  const fill = useRef(new Animated.Value(on ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    m.to(fill, on ? 1 : 0, { kind: 'effects', speed: 'fast' }).start();
    if (on && !first.current && !m.reduced) {
      // Bounce: start small and let the expressive fast spring (ζ 0.6) overshoot back to size.
      pop.setValue(0.7);
      m.to(pop, 1, { speed: 'fast' }).start();
    }
    first.current = false;
  }, [on]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={{ width: 24, height: 24, transform: [{ scale: pop }] }}>
      <Animated.View style={{ position: 'absolute', opacity: fill.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
        <MaterialCommunityIcons name={(icon + '-outline') as any} size={24} color={color} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', opacity: fill }}>
        <MaterialCommunityIcons name={icon as any} size={24} color={activeColor} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * M3 navigation bar. The indicator pill follows the selection with two springs, a fast
 * leading edge and a slow trailing edge, so it stretches toward the new tab mid-flight and
 * snaps back to a pill when it lands. Icons switch outlined → filled with a small bounce.
 */
export function MorphNavBar({ items, active, onChange, showIndicator = true, colors }: { items: NavItem[]; active: string; onChange: (id: string) => void; showIndicator?: boolean; colors: { bg: string; pill: string; icon: string; iconActive: string; text: string } }) {
  const m = useMotion();
  const idx = Math.max(0, items.findIndex(i => i.id === active));
  const lead = useRef(new Animated.Value(idx)).current;
  const trail = useRef(new Animated.Value(idx)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    m.to(lead, idx, { speed: 'fast' }).start();
    m.to(trail, idx, { speed: 'slow' }).start();
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const cell = w / items.length;
  const gap = Animated.subtract(lead, trail);
  const stretch = gap.interpolate({ inputRange: [-4, 0, 4], outputRange: [1 + (4 * cell) / PILL_W, 1, 1 + (4 * cell) / PILL_W] });
  const centre = Animated.multiply(Animated.add(lead, trail), cell / 2);

  return (
    <View style={{ height: 80, backgroundColor: colors.bg, flexDirection: 'row' }} onLayout={e => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {w > 0 && showIndicator && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 12,
            left: (cell - PILL_W) / 2,
            width: PILL_W,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.pill,
            transform: [{ translateX: centre }, { scaleX: m.reduced ? 1 : stretch }],
          }}
        />
      )}
      {items.map(it => {
        const on = it.id === active && showIndicator;
        return (
          <Pressable
            key={it.id}
            style={{ flex: 1, alignItems: 'center', paddingTop: 16, gap: 8 }}
            onPress={() => {
              if (it.id !== active) haptics.tick();
              onChange(it.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: on }}
          >
            <NavIcon icon={it.icon} on={on} color={colors.icon} activeColor={colors.iconActive} />
            <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: on ? '700' : '500', color: colors.text }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
