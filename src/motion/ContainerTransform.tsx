import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Animated, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { useMotion } from './MotionProvider';

type ViewRef = ComponentRef<typeof View>;
type Rect = { x: number; y: number; width: number; height: number };
type Source = { ref: RefObject<ViewRef | null>; color: string; radius: number };
type Api = {
  /** Grow from the SharedElement `id` to fill the host, calling `swap` while it travels. */
  open: (id: string, swap: () => void) => void;
  /** Shrink back into SharedElement `id`, calling `swap` first. */
  close: (id: string | null | undefined, swap: () => void) => void;
  register: (id: string, s: Source | null) => void;
};

const Ctx = createContext<Api>({ open: (_i, swap) => swap(), close: (_i, swap) => swap(), register: () => {} });
export const useContainerTransform = () => useContext(Ctx);

/**
 * M3 container transform. The host owns a plain surface that is scaled (transform only)
 * between the tapped card's bounds and the full screen; the destination fades in on top.
 * Reduced motion: the surface skips the travel and the screens simply cross-fade.
 */
export function ContainerTransformHost({ children }: { children: ReactNode }) {
  const m = useMotion();
  const host = useRef<ViewRef>(null);
  const [frame, setFrame] = useState<LayoutRectangle | null>(null);
  const [surface, setSurface] = useState<{ rect: Rect; color: string; radius: number } | null>(null);
  const p = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const sources = useRef(new Map<string, Source>());
  const register = useCallback<Api['register']>((id, src) => {
    // Unmounting keeps the entry: its colour and radius are still needed to close back into
    // the card once the list re-mounts and registers a fresh ref.
    if (src) sources.current.set(id, src);
  }, []);

  const measure = (ref: RefObject<ViewRef | null>, cb: (r: Rect | null) => void) => {
    const node = ref.current;
    const h = host.current;
    if (!node || !h) return cb(null);
    h.measureInWindow((hx, hy) => node.measureInWindow((x, y, width, height) => cb(width ? { x: x - hx, y: y - hy, width, height } : null)));
  };

  const open = useCallback<Api['open']>((id, swap) => {
    const src = sources.current.get(id);
    if (!src) return swap();
    const { color, radius } = src;
    measure(src.ref, rect => {
      if (!rect || !frame || m.reduced) return swap();
      setSurface({ rect, color, radius });
      p.setValue(0);
      fade.setValue(1);
      m.to(p, 1, { speed: 'default' }).start();
      // Swap screens while the surface is mid-flight so the destination is ready when it lands.
      setTimeout(() => {
        swap();
        m.to(fade, 0, { kind: 'effects', delay: 120 }).start(() => setSurface(null));
      }, 220);
    });
  }, [frame, m]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback<Api['close']>((id, swap) => {
    const src = id ? sources.current.get(id) : undefined;
    if (!src || !frame || m.reduced) return swap();
    setSurface({ rect: { x: 0, y: 0, width: frame.width, height: frame.height }, color: src.color, radius: src.radius });
    p.setValue(1);
    fade.setValue(1);
    swap();
    // Re-measure after the list is back (the card re-registers on mount), so it's found where it now sits.
    setTimeout(() => measure((id && sources.current.get(id)?.ref) || src.ref, rect => {
      if (!rect) return m.to(fade, 0, { kind: 'effects' }).start(() => setSurface(null));
      setSurface({ rect, color: src.color, radius: src.radius });
      m.to(p, 0, { speed: 'default' }).start();
      m.to(fade, 0, { kind: 'effects', delay: 160 }).start(() => setSurface(null));
    }), 60);
  }, [frame, m]); // eslint-disable-line react-hooks/exhaustive-deps

  let style = null;
  if (surface && frame) {
    const { rect } = surface;
    const W = frame.width;
    const H = frame.height;
    style = {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      width: W,
      height: H,
      borderRadius: surface.radius,
      backgroundColor: surface.color,
      opacity: fade,
      transform: [
        { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [rect.x + rect.width / 2 - W / 2, 0] }) },
        { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [rect.y + rect.height / 2 - H / 2, 0] }) },
        { scaleX: p.interpolate({ inputRange: [0, 1], outputRange: [rect.width / W, 1] }) },
        { scaleY: p.interpolate({ inputRange: [0, 1], outputRange: [rect.height / H, 1] }) },
      ],
    };
  }

  return (
    <Ctx.Provider value={{ open, close, register }}>
      <View ref={host} style={{ flex: 1 }} onLayout={e => setFrame(e.nativeEvent.layout)}>
        {children}
        {style && <Animated.View pointerEvents="none" style={style} />}
      </View>
    </Ctx.Provider>
  );
}

/** Marks a view as the source/return target of a container transform with the given id. */
export function SharedElement({ id, color = '#fff', radius = 20, style, children }: { id: string; color?: string; radius?: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { register } = useContainerTransform();
  const ref = useRef<ViewRef>(null);
  useEffect(() => {
    register(id, { ref, color, radius });
    return () => register(id, null);
  }, [id, color, radius, register]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
