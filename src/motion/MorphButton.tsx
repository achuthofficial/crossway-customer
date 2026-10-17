import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMotion, ND } from './MotionProvider';
import { useAnimatedNumber, useChange, useValue } from './hooks';
import { lerp, pathAround, pillRadii, rotateRadii, shapeRadii } from './geometry';
import { haptics } from './haptics';

export type MorphState = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  state: MorphState;
  label: string;
  successLabel?: string;
  onPress?: () => void;
  height?: number;
  color?: string;
  fg?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const CHECK = 'M-7,0.5 L-2,5.5 L8,-5';
const CHECK_LEN = 23;

/**
 * Pill → loading shape (rotating cookie) → circle with a drawn check.
 * The container never changes layout size: the visible shape is an SVG path morphed
 * point-by-point, so neighbours don't reflow while it animates.
 */
export function MorphButton({ state, label, successLabel, onPress, height = 52, color = '#0B57D0', fg = '#fff', disabled, style }: Props) {
  const m = useMotion();
  const [w, setW] = useState(0);
  const morph = useValue(0); // 0 pill, 1 loading shape, 2 circle
  const spin = useValue(0);
  const labelO = useValue(1);
  const check = useValue(0);
  const shake = useValue(0);
  const p = useAnimatedNumber(morph);
  const rot = useAnimatedNumber(spin);
  const c = useAnimatedNumber(check);

  useEffect(() => {
    const target = state === 'loading' ? 1 : state === 'success' ? 2 : 0;
    m.to(morph, target, { native: false, speed: state === 'success' ? 'fast' : 'default' }).start();
    m.to(labelO, state === 'idle' || state === 'error' ? 1 : 0, { kind: 'effects', speed: 'fast' }).start();
    m.tween(check, state === 'success' ? 1 : 0, state === 'success' ? 320 : 100, { native: false, delay: state === 'success' ? 120 : 0 }).start();
    if (state === 'loading' && !m.reduced) {
      spin.setValue(0);
      const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: false }));
      loop.start();
      return () => loop.stop();
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  useChange(state, (_, next) => {
    if (next === 'success') haptics.success();
    if (next === 'error') {
      haptics.error();
      shake.setValue(0);
      // Shake is a short tween: springs only run between two values.
      Animated.timing(shake, { toValue: 1, duration: m.reduced ? 0 : 360, easing: Easing.linear, useNativeDriver: ND }).start();
    }
  });

  const r = height / 2;
  let d = '';
  if (w > 0) {
    const pill = pillRadii(w, height);
    // Only the cookie turns; the pill and circle stay level.
    const cookie = rotateRadii(shapeRadii('cookie9', r), rot * Math.PI * 2);
    const circle = shapeRadii('circle', r);
    const radii = p <= 1 ? lerp(pill, cookie, Math.max(0, p)) : lerp(cookie, circle, Math.min(1.08, p - 1));
    d = pathAround(radii, w / 2, r);
  }
  const busy = state === 'loading' || state === 'success';
  const a11y = state === 'loading' ? label + ', in progress' : state === 'success' ? successLabel || 'Done' : label;

  return (
    <Pressable
      onPress={busy || disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ busy: state === 'loading', disabled: !!disabled }}
      accessibilityLiveRegion="polite"
      style={[{ height, alignSelf: 'stretch' }, style]}
      onLayout={e => setW(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity: disabled ? 0.45 : 1,
          transform: [{ translateX: shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -10, 9, -6, 4, 0] }) }],
        }}
      >
        {w > 0 && (
          <Svg width={w} height={height} style={{ position: 'absolute' }}>
            <Path d={d} fill={color} />
            <Path
              d={CHECK}
              transform={`translate(${w / 2},${r})`}
              stroke={fg}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={CHECK_LEN}
              strokeDashoffset={CHECK_LEN * (1 - c)}
              opacity={c > 0.01 ? 1 : 0}
            />
          </Svg>
        )}
        <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: labelO }} pointerEvents="none">
          <Text numberOfLines={1} style={{ color: fg, fontSize: height >= 52 ? 16 : 14, fontWeight: '500' }}>{label}</Text>
        </Animated.View>
      </Animated.View>
      {state === 'success' && !!successLabel && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: height + 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: color }}>{successLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}
