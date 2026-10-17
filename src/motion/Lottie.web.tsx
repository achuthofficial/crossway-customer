import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import lottie, { type AnimationItem } from 'lottie-web';
import { useMotion } from './MotionProvider';
import { maxLoops } from './lottiePolicy';
import type { LottieProps } from './Lottie';

/** Web: lottie-web (SVG renderer). Same loop budget and tap-to-replay as native. */
export function Lottie({ source, size = 160, accessibilityLabel }: LottieProps) {
  const m = useMotion();
  const host = useRef<any>(null);
  const anim = useRef<AnimationItem | null>(null);

  const play = () => {
    const a = anim.current;
    if (!a || m.reduced) return;
    let loops = 0;
    const limit = maxLoops((a.totalFrames / a.frameRate) * 1000);
    a.removeEventListener('loopComplete');
    a.addEventListener('loopComplete', () => {
      if (++loops >= limit) a.goToAndStop(a.totalFrames - 1, true);
    });
    a.goToAndPlay(0, true);
  };

  useEffect(() => {
    if (!host.current) return;
    const a = lottie.loadAnimation({ container: host.current, renderer: 'svg', loop: true, autoplay: false, animationData: source });
    anim.current = a;
    a.addEventListener('DOMLoaded', () => (m.reduced ? a.goToAndStop(a.totalFrames - 1, true) : play()));
    return () => {
      a.destroy();
      anim.current = null;
    };
  }, [source, m.reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Pressable onPress={play} accessibilityRole="image" accessibilityLabel={accessibilityLabel} accessibilityHint="Tap to replay the animation">
      <View ref={host} style={{ width: size, height: size }} />
    </Pressable>
  );
}
