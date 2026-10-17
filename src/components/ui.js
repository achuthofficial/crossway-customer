import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, T } from '../theme';
import { ND, ShapeMorph, useMotion } from '../motion';

export { ND, CountUp } from '../motion'; // useNativeDriver is unsupported on web

// Material Symbols names from the design that MaterialIcons spells differently.
const ALIAS = { person_alert: 'person-search', shield_person: 'security' };

export function Icon({ name, size = 22, color = C.text, style }) {
  return <MaterialIcons name={ALIAS[name] || name.replace(/_/g, '-')} size={size} color={color} style={style} />;
}

/** Pressable that springs down slightly on press. */
export function Tap({ onPress, disabled, style, children, scaleTo = 0.96, accessibilityLabel }) {
  const m = useMotion();
  const s = useRef(new Animated.Value(1)).current;
  const to = v => m.to(s, v, { speed: 'fast' }).start();
  // Layout props must live on the Pressable so the touch target takes the space, not just the visual.
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const inner = { ...flat };
  for (const k of ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth']) {
    if (flat[k] !== undefined) outer[k] = flat[k];
    delete inner[k];
  }
  if (outer.width !== undefined || outer.flex !== undefined) inner.flexGrow = 1;
  return (
    <Pressable
      style={outer}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[inner, { transform: [{ scale: s }] }, disabled && { opacity: 0.45 }]}>{children}</Animated.View>
    </Pressable>
  );
}

const KINDS = {
  p: [C.primary, '#fff', 0],
  d: [C.danger, '#fff', 0],
  t: [C.primarySoft, C.primaryDark, 0],
  o: ['#fff', C.primary, 1],
  g: [C.surface3, C.muted, 0],
};

/** Pill button. kind: p primary, d danger, t tonal, o outline, g grey. */
export function Btn({ label, onPress, kind = 'p', icon, disabled, height = 56, full = true, align = 'left', style, bg, fg }) {
  const [b, f, bw] = KINDS[kind];
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { height, borderRadius: height / 2, backgroundColor: bg || b, borderWidth: bw, alignSelf: full ? 'stretch' : 'flex-start', justifyContent: align === 'center' ? 'center' : 'flex-start' },
        style,
      ]}
    >
      {icon ? <Icon name={icon} color={fg || f} size={22} /> : null}
      <Text style={[styles.btnText, { color: fg || f, fontSize: height >= 52 ? 16 : 14 }]}>{label}</Text>
    </Tap>
  );
}

export const Tag = ({ sev, children, icon }) => (
  <View style={[styles.tag, { backgroundColor: T[sev][0] }]}>
    {icon ? <Icon name={icon} size={15} color={T[sev][1]} /> : null}
    <Text style={{ fontSize: 12, fontWeight: '600', color: T[sev][1] }}>{children}</Text>
  </View>
);

/**
 * Rises and fades in on mount with token springs (spatial for the rise, effects for the fade).
 * `delay` staggers lists; keep it to 30–50 ms steps, capped at 8 items.
 */
export function FadeIn({ delay = 0, from = 14, style, children }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    m.to(v, 1, { delay }).start();
    m.to(o, 1, { kind: 'effects', delay }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={[style, { opacity: o, transform: m.reduced ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Pops in with the expressive fast spring (slight overshoot); good for success icons. */
export function Pop({ delay = 0, children, style }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(m.reduced ? 1 : 0)).current;
  useEffect(() => {
    m.to(v, 1, { delay, speed: 'fast' }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>;
}

/**
 * Expanding ring behind a circle, e.g. a live dot or mic. Runs 3 times (4.8 s) and stops,
 * staying under the 5 s auto-play limit; pass `iterations` to change. Off with reduced motion.
 */
export function Pulse({ size, color, style, iterations = 3 }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (m.reduced) return;
    v.setValue(0);
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: ND }), { iterations });
    loop.start(() => v.setValue(1));
    return () => loop.stop();
  }, [v, iterations, m.reduced]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
        { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] },
      ]}
    />
  );
}

/** Loading indicator: the M3 Expressive shape morph (cookie → clover → pill → burst → squircle). */
export function Spin({ size = 40, color = C.primary }) {
  return <ShapeMorph size={size} color={color} />;
}

/** Material-style switch with an animated knob. */
export function Switch({ value, onChange, label }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    m.to(v, value ? 1 : 0, { speed: 'fast', native: false }).start();
  }, [value, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Pressable onPress={onChange} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label}>
      <Animated.View
        style={{
          width: 52, height: 32, borderRadius: 16, justifyContent: 'center',
          backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['#E1E3E1', C.primary] }),
          borderWidth: value ? 0 : 2, borderColor: C.outline,
        }}
      >
        <Animated.View
          style={{
            position: 'absolute', borderRadius: 12,
            backgroundColor: value ? '#fff' : C.outline,
            width: v.interpolate({ inputRange: [0, 1], outputRange: [16, 24] }),
            height: v.interpolate({ inputRange: [0, 1], outputRange: [16, 24] }),
            left: v.interpolate({ inputRange: [0, 1], outputRange: [6, 24] }),
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Thin progress bar whose fill springs to `pct` (0–1). Animates scaleX from the left: transform only. */
export function Bar({ pct, color = C.primary, height = 4, style }) {
  const m = useMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    m.to(v, pct, { speed: 'slow' }).start();
  }, [pct, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={[{ flex: 1, height, borderRadius: height / 2, backgroundColor: '#E1E3E1', overflow: 'hidden' }, style]}>
      <Animated.View style={{ height: '100%', width: '100%', backgroundColor: color, transformOrigin: 'left', transform: [{ scaleX: v }] }} />
    </View>
  );
}

export const H1 = ({ children, style }) => <Text style={[styles.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }) => <Text style={[styles.h2, style]}>{children}</Text>;
export const Muted = ({ children, style }) => <Text style={[styles.muted, style]}>{children}</Text>;

export const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, borderColor: C.outline },
  btnText: { fontWeight: '500' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  h1: { fontSize: 28, lineHeight: 36, color: C.text },
  h2: { fontSize: 18, fontWeight: '500', color: C.text },
  muted: { fontSize: 14, color: C.muted, lineHeight: 20 },
});
