import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { useMotion } from './MotionProvider';
import { useAnimatedNumber, useValue } from './hooks';

export type GraphNode = { id: string; label: string; x: number; y: number; color: string; parent?: string };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Referral network: lines draw out from you to each person you invited (and on to who they
 * invited), each node popping in as its line arrives. The lines glow, pulsing twice and then
 * holding steady, so nothing loops past 5 s. Coordinates are 0..1 of the graph box.
 */
export function ReferralGraph({ nodes, height = 220, root = 'you' }: { nodes: GraphNode[]; height?: number; root?: string }) {
  const m = useMotion();
  const [w, setW] = useState(0);
  const t = useValue(m.reduced ? 1 : 0);
  const glow = useValue(0);
  const k = useAnimatedNumber(t);
  const g = useAnimatedNumber(glow);

  useEffect(() => {
    if (m.reduced) return;
    t.setValue(0);
    Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: false }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ]),
        { iterations: 2 },
      ),
    ]).start();
  }, [nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = nodes.filter(n => n.parent);
  // Depth decides when a line starts: first-degree first, then their referrals.
  const depth = (n: GraphNode): number => (n.parent ? 1 + depth(byId[n.parent]) : 0);
  const P = (n: GraphNode) => [n.x * w, n.y * height] as const;

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ height }} accessibilityRole="image" accessibilityLabel={`Your referral network: ${edges.length} people`}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {edges.map((n, i) => {
            const [x1, y1] = P(byId[n.parent!]);
            const [x2, y2] = P(n);
            const start = (depth(n) - 1) * 0.45 + i * 0.04;
            const p = clamp01((k - start) / 0.4);
            const x = x1 + (x2 - x1) * p;
            const y = y1 + (y2 - y1) * p;
            return (
              <G key={'e' + n.id}>
                <Line x1={x1} y1={y1} x2={x} y2={y} stroke={n.color} strokeWidth={12} strokeLinecap="round" opacity={0.12 + 0.18 * g} />
                <Line x1={x1} y1={y1} x2={x} y2={y} stroke={n.color} strokeWidth={3} strokeLinecap="round" />
              </G>
            );
          })}
          {nodes.map((n, i) => {
            const [x, y] = P(n);
            const start = n.parent ? (depth(n) - 1) * 0.45 + 0.3 + i * 0.03 : 0;
            const p = n.parent ? clamp01((k - start) / 0.25) : 1;
            // Pop with a little overshoot (back-out) so arrivals feel springy.
            const s = p >= 1 ? 1 : p * (1 + 0.5 * Math.sin(p * Math.PI));
            const r = n.id === root ? 26 : 18;
            return (
              <G key={n.id} opacity={p > 0 ? 1 : 0}>
                <Circle cx={x} cy={y} r={r * s} fill={n.color} />
                <SvgText x={x} y={y + 4.5} fontSize={n.id === root ? 14 : 11} fontWeight="600" fill="#fff" textAnchor="middle">{n.label.split(' ').map(p => p[0]).join('').slice(0, 2)}</SvgText>
                {n.id !== root && <SvgText x={x} y={y + r + 14} fontSize={11} fill="#444746" textAnchor="middle" opacity={p}>{n.label}</SvgText>}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
