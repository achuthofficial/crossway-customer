import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import { spring as springToken, tokens, type MotionSchemeName, type SpringKind, type SpringSpeed } from '../../design-tokens/tokens';

/** Animated's native driver is unavailable on web; everything else uses it. */
export const ND = Platform.OS !== 'web';

type Ctx = { scheme: MotionSchemeName; reduced: boolean };
const MotionCtx = createContext<Ctx>({ scheme: 'expressive', reduced: false });

/**
 * Supplies the motion scheme (expressive for the worker app) and the OS reduce-motion
 * setting. On web, react-native-web answers from prefers-reduced-motion.
 */
export function MotionProvider({ scheme = 'expressive', children }: { scheme?: MotionSchemeName; children: ReactNode }) {
  // Web can answer synchronously, so the very first frame (the splash) already respects it.
  const [reduced, setReduced] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => live && setReduced(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => setReduced(!!v));
    return () => {
      live = false;
      sub?.remove?.();
    };
  }, []);
  const value = useMemo(() => ({ scheme, reduced }), [scheme, reduced]);
  return <MotionCtx.Provider value={value}>{children}</MotionCtx.Provider>;
}

export type SpringOpts = { kind?: SpringKind; speed?: SpringSpeed; delay?: number; native?: boolean; velocity?: number };

export function useMotion() {
  const { scheme, reduced } = useContext(MotionCtx);
  return useMemo(() => {
    /** Animated.spring config from the token table. Effects springs never overshoot. */
    const config = (kind: SpringKind = 'spatial', speed: SpringSpeed = 'default') => {
      const t = springToken(scheme, kind, speed);
      return { stiffness: t.stiffness, damping: t.damping, mass: t.mass, overshootClamping: kind === 'effects' };
    };
    /**
     * Animate a value with a token spring. With reduce motion on, spatial movement
     * becomes a short linear fade-length change so nothing travels or bounces.
     */
    const to = (v: Animated.Value | Animated.ValueXY, toValue: any, o: SpringOpts = {}) => {
      const useNativeDriver = o.native ?? ND;
      if (reduced && (o.kind ?? 'spatial') === 'spatial') {
        return Animated.timing(v as Animated.Value, { toValue, duration: tokens.duration.short, delay: 0, easing: Easing.linear, useNativeDriver });
      }
      return Animated.spring(v as Animated.Value, { toValue, delay: o.delay ?? 0, velocity: o.velocity, useNativeDriver, ...config(o.kind, o.speed) });
    };
    /** Timed tween for things springs can't express (dash offsets, sequences). */
    const tween = (v: Animated.Value, toValue: number, duration: number = tokens.duration.medium, o: { delay?: number; native?: boolean; easing?: keyof typeof tokens.easing } = {}) => {
      const e = tokens.easing[o.easing ?? 'emphasizedDecelerate'];
      return Animated.timing(v, {
        toValue,
        duration: reduced ? Math.min(duration, tokens.duration.short) : duration,
        delay: reduced ? 0 : o.delay ?? 0,
        easing: Easing.bezier(e[0], e[1], e[2], e[3]),
        useNativeDriver: o.native ?? ND,
      });
    };
    /** Stagger delay in ms: 40 ms apart, capped at 8 items so long lists don't lag. */
    const stagger = (i: number) => (reduced ? 0 : Math.min(i, tokens.stagger.maxItems) * tokens.stagger.interval);
    return { scheme, reduced, config, to, tween, stagger };
  }, [scheme, reduced]);
}

export type Motion = ReturnType<typeof useMotion>;
