import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Canvas, Group, Skia, Skottie } from '@shopify/react-native-skia';
import { useMotion } from './MotionProvider';
import { maxLoops } from './lottiePolicy';

export type LottieProps = { source: object; size?: number; accessibilityLabel?: string };

/**
 * Native: Skia's Skottie renders the Lottie JSON (works in Expo Go; no extra native module).
 * Plays whole loops within the 5 s auto-play budget, then rests on the last frame.
 * Reduced motion shows the last frame only. Tap replays.
 */
export function Lottie({ source, size = 160, accessibilityLabel }: LottieProps) {
  const m = useMotion();
  const animation = useMemo(() => Skia.Skottie.Make(JSON.stringify(source)), [source]);
  const total = animation.duration() * animation.fps();
  const [frame, setFrame] = useState(m.reduced ? total - 1 : 0);
  const [run, setRun] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (m.reduced) {
      setFrame(total - 1);
      return;
    }
    const ms = animation.duration() * 1000;
    const end = ms * maxLoops(ms);
    const t0 = Date.now();
    const tick = () => {
      const t = Date.now() - t0;
      if (t >= end) return setFrame(total - 1);
      setFrame(((t % ms) / ms) * total);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [animation, run, m.reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Pressable onPress={() => setRun(r => r + 1)} accessibilityRole="image" accessibilityLabel={accessibilityLabel} accessibilityHint="Tap to replay the animation">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / animation.size().width }]}>
          <Skottie animation={animation} frame={frame} />
        </Group>
      </Canvas>
    </Pressable>
  );
}
