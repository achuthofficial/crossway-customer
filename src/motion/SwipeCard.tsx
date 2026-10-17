import { useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMotion } from './MotionProvider';
import { haptics } from './haptics';

const THRESHOLD = 0.3; // fraction of width that commits the swipe
const STRETCH = 56; // max extra px past the threshold (rubber band)

let lastSwipeAt = 0;
/** True for a moment after a swipe ends, so the release isn't also read as a tap on the card. */
export const wasSwiping = () => Date.now() - lastSwipeAt < 350;

/** Past the threshold the card keeps following the finger, with growing resistance. */
export const rubberBand = (dx: number, t: number) => {
  const a = Math.abs(dx);
  if (a <= t) return dx;
  const over = a - t;
  return Math.sign(dx) * (t + STRETCH * (1 - 1 / (over / STRETCH + 1)));
};

type Props = {
  onSave: () => void;
  onSkip: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

/**
 * Swipe right to save, left to skip. The action behind the card is revealed as it moves;
 * crossing the threshold gives a haptic tick and the card tilts with the drag. Screen-reader
 * users get the same two actions through accessibilityActions.
 */
export function SwipeCard({ onSave, onSkip, children, style, disabled }: Props) {
  const m = useMotion();
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(360);
  const wRef = useRef(360);
  const armed = useRef(0);
  const live = useRef({ onSave, onSkip, m, disabled });
  live.current = { onSave, onSkip, m, disabled };

  const fling = (dir: 1 | -1, vx = 0) => {
    haptics.commit();
    live.current.m.to(x, dir * wRef.current * 1.15, { speed: 'fast', velocity: vx }).start(() => (dir > 0 ? live.current.onSave() : live.current.onSkip()));
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => !live.current.disabled && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
      onPanResponderGrant: () => {
        armed.current = 0;
      },
      onPanResponderMove: (_, g) => {
        lastSwipeAt = Date.now();
        const t = wRef.current * THRESHOLD;
        x.setValue(rubberBand(g.dx, t));
        const state = g.dx > t ? 1 : g.dx < -t ? -1 : 0;
        if (state !== armed.current) {
          if (state !== 0) haptics.tick();
          armed.current = state;
        }
      },
      onPanResponderRelease: (_, g) => {
        lastSwipeAt = Date.now();
        const t = wRef.current * THRESHOLD;
        if (g.dx > t || g.vx > 0.9) fling(1, g.vx);
        else if (g.dx < -t || g.vx < -0.9) fling(-1, g.vx);
        else live.current.m.to(x, 0, { speed: 'fast', velocity: g.vx }).start();
      },
      onPanResponderTerminate: () => live.current.m.to(x, 0, { speed: 'fast' }).start(),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const t = w * THRESHOLD;
  return (
    <View
      onLayout={e => {
        wRef.current = e.nativeEvent.layout.width;
        setW(wRef.current);
      }}
      accessible={false}
      accessibilityActions={[{ name: 'save', label: 'Save for later' }, { name: 'skip', label: 'Not interested' }]}
      onAccessibilityAction={e => (e.nativeEvent.actionName === 'save' ? onSave() : onSkip())}
    >
      {/* Revealed actions */}
      <Animated.View style={[st.under, { backgroundColor: '#C4EED0', opacity: x.interpolate({ inputRange: [0, 24, t], outputRange: [0, 0.6, 1], extrapolate: 'clamp' }) }]}>
        <Animated.View style={[st.hint, { transform: [{ scale: x.interpolate({ inputRange: [0, t, t + 1], outputRange: [0.6, 1.15, 1.15], extrapolate: 'clamp' }) }] }]}>
          <MaterialIcons name="bookmark-add" size={26} color="#072711" />
          <Text style={{ color: '#072711', fontWeight: '600' }}>Save</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[st.under, { backgroundColor: '#E9EEF6', alignItems: 'flex-end', opacity: x.interpolate({ inputRange: [-t, -24, 0], outputRange: [1, 0.6, 0], extrapolate: 'clamp' }) }]}>
        <Animated.View style={[st.hint, { transform: [{ scale: x.interpolate({ inputRange: [-t - 1, -t, 0], outputRange: [1.15, 1.15, 0.6], extrapolate: 'clamp' }) }] }]}>
          <Text style={{ color: '#444746', fontWeight: '600' }}>Skip</Text>
          <MaterialIcons name="close" size={26} color="#444746" />
        </Animated.View>
      </Animated.View>
      <Animated.View
        {...pan.panHandlers}
        style={[
          style,
          { userSelect: 'none' } as object,
          {
            transform: [
              { translateX: x },
              { rotate: m.reduced ? '0deg' : x.interpolate({ inputRange: [-w, 0, w], outputRange: ['-7deg', '0deg', '7deg'] }) },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const st = {
  under: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0, borderRadius: 20, justifyContent: 'center' as const, paddingHorizontal: 22 },
  hint: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
};
