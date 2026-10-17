import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMotion } from './MotionProvider';
import { useAnimatedNumber, useValue } from './hooks';
import { lerp, pathAround, shapeRadii } from './geometry';

const SIZE = 168;
// Two routes that cross, like the CrossWay mark: one sweeps up-right, the other up-left.
const ROUTE_A = 'M52,128 C66,108 78,96 92,84 S112,58 118,44';
const ROUTE_B = 'M118,128 C104,108 92,96 80,86 S60,60 54,44';
const LEN = 120;

/**
 * Launch moment: two paths draw in and cross, a shape grows behind them and morphs from a
 * cookie into the app's squircle, then the squircle expands to fill the screen (container
 * transform) and fades to reveal the first screen. ~1.6 s, tap to skip.
 * Reduced motion: the finished mark fades in and out.
 */
export function Splash({ color = '#0B57D0', onDone }: { color?: string; onDone: () => void }) {
  const m = useMotion();
  const draw = useValue(0);
  const morph = useValue(0);
  const grow = useValue(1);
  const fade = useValue(1);
  const d = useAnimatedNumber(draw);
  const k = useAnimatedNumber(morph);
  const [box, setBox] = useState({ w: 400, h: 800 });
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    if (m.reduced) {
      draw.setValue(1);
      morph.setValue(1);
      const t = setTimeout(() => m.to(fade, 0, { kind: 'effects', speed: 'slow' }).start(finish), 500);
      return () => clearTimeout(t);
    }
    const scaleTo = (Math.hypot(box.w, box.h) / SIZE) * 1.1;
    Animated.sequence([
      m.tween(draw, 1, 560, { native: false }),
      m.to(morph, 1, { native: false, speed: 'slow' }),
      Animated.delay(120),
      Animated.parallel([m.to(grow, scaleTo, { speed: 'slow' }), m.to(fade, 0, { kind: 'effects', speed: 'slow', delay: 180 })]),
    ]).start(finish);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shape: hidden (r 0) → cookie while the routes cross → squircle, the app shape.
  const r = (SIZE / 2) * Math.min(1, k * 1.6);
  const shape = pathAround(lerp(shapeRadii('cookie9', r), shapeRadii('squircle', r), Math.max(0, k)), SIZE / 2, SIZE / 2);
  const routeColor = k > 0.35 ? '#fff' : color;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: fade, zIndex: 50 }]} onLayout={e => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Pressable style={st.center} onPress={finish} accessibilityLabel="CrossWay. Tap to skip">
        <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ scale: grow }] }}>
          <Svg width={SIZE} height={SIZE}>
            {k > 0.01 && <Path d={shape} fill={color} />}
          </Svg>
        </Animated.View>
        <View style={[StyleSheet.absoluteFill, st.center]} pointerEvents="none">
          <Svg width={SIZE} height={SIZE}>
            <Path d={ROUTE_A} stroke={routeColor} strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - d)} />
            <Path d={ROUTE_B} stroke={routeColor} strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - Math.max(0, d * 1.15 - 0.15))} />
            <Path d="M104,40 L120,40 L120,56" stroke={routeColor} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={d > 0.9 ? 1 : 0} />
            <Path d="M66,40 L50,40 L50,56" stroke={routeColor} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={d > 0.95 ? 1 : 0} />
          </Svg>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
