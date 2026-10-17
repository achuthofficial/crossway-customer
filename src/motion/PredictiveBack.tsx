import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useMotion } from './MotionProvider';
import { haptics } from './haptics';

export type PredictiveBackHandle = { back: () => void };

const EDGE = 28; // px from the left edge where the gesture may start
const COMMIT = 0.32; // fraction of the width that commits the back

/**
 * Predictive back with a live preview. Dragging from the left edge shrinks the page
 * (scale 1 → 0.9, slides with the finger, rounded corners) and reveals the screen behind
 * it; past the threshold a haptic tick confirms that letting go will go back.
 * `back()` runs the same exit for the system back button. Reduced motion: fade only.
 */
export const PredictiveBack = forwardRef<PredictiveBackHandle, { onBack: () => void; under?: ReactNode; children: ReactNode }>(
  function PredictiveBack({ onBack, under, children }, ref) {
    const m = useMotion();
    const p = useRef(new Animated.Value(0)).current;
    const [w, setW] = useState(400);
    const wRef = useRef(400);
    const [active, setActive] = useState(false);
    const armed = useRef(false);
    // The pan responder is created once; read the latest props and motion settings through refs.
    const live = useRef({ onBack, m });
    live.current = { onBack, m };

    const exit = (velocity = 0) => {
      haptics.commit();
      live.current.m.to(p, 1.02, { speed: 'fast', velocity }).start(() => {
        live.current.onBack();
        p.setValue(0);
        setActive(false);
      });
    };
    useImperativeHandle(ref, () => ({ back: () => { setActive(true); exit(); } }));

    const pan = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (e, g) => g.x0 - g.dx < EDGE + 4 && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
        onPanResponderGrant: () => {
          armed.current = false;
          setActive(true);
        },
        onPanResponderMove: (_, g) => {
          const v = Math.max(0, Math.min(1, g.dx / wRef.current));
          p.setValue(v);
          if (v > COMMIT !== armed.current) {
            armed.current = v > COMMIT;
            haptics.tick();
          }
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx / wRef.current > COMMIT || g.vx > 0.6) exit(g.vx);
          else live.current.m.to(p, 0, { speed: 'fast' }).start(() => setActive(false));
        },
        onPanResponderTerminate: () => live.current.m.to(p, 0, { speed: 'fast' }).start(() => setActive(false)),
        onPanResponderTerminationRequest: () => false,
      }),
    ).current;

    const page = m.reduced
      ? { opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' }) }
      : {
          transform: [
            { translateX: p.interpolate({ inputRange: [0, 1, 1.02], outputRange: [0, w * 0.08, w * 0.6] }) },
            { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9], extrapolate: 'clamp' }) },
          ],
          opacity: p.interpolate({ inputRange: [0, 1, 1.02], outputRange: [1, 1, 0] }),
        };

    return (
      <View style={{ flex: 1 }} onLayout={e => { wRef.current = e.nativeEvent.layout.width; setW(wRef.current); }} {...pan.panHandlers}>
        {active && under ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1], extrapolate: 'clamp' }) }}>
            {under}
          </Animated.View>
        ) : null}
        <Animated.View style={[{ flex: 1, backgroundColor: '#fff', overflow: 'hidden', borderRadius: active ? 28 : 0 }, active && ({ userSelect: 'none' } as object), page]}>{children}</Animated.View>
      </View>
    );
  },
);
