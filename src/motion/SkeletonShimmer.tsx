import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { useMotion, ND } from './MotionProvider';
import { useValue } from './hooks';

/**
 * Placeholder bars with a moving highlight (transform only) that crossfade into the
 * real content when `loading` turns false. Reduced motion keeps the bars still.
 */
export function SkeletonShimmer({ loading, lines = 3, height = 14, children, style }: { loading: boolean; lines?: number; height?: number; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const m = useMotion();
  const sweep = useValue(0);
  const content = useValue(loading ? 0 : 1);
  const [w, setW] = useState(300);
  const [showSkel, setShowSkel] = useState(loading);
  useEffect(() => {
    if (loading) {
      setShowSkel(true);
      content.setValue(0);
      if (m.reduced) return;
      const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }));
      loop.start();
      return () => loop.stop();
    }
    m.to(content, 1, { kind: 'effects' }).start(() => setShowSkel(false));
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={style} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Animated.View style={{ opacity: content }}>{!loading && children}</Animated.View>
      {showSkel && (
        <Animated.View
          accessibilityLabel="Loading"
          style={[{ gap: 10 }, !loading && { position: 'absolute', left: 0, right: 0, top: 0 }, { opacity: content.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        >
          {Array.from({ length: lines }, (_, i) => (
            <View key={i} style={{ height, width: i === lines - 1 ? '60%' : '100%', borderRadius: height / 2, backgroundColor: '#E9EEF6', overflow: 'hidden' }}>
              <Animated.View
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255,255,255,.7)',
                  transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-80, w] }) }, { skewX: '-20deg' }],
                }}
              />
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}
