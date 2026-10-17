// Shape-morph geometry shared by all CrossWay apps (web SVG and react-native-svg).
// Every M3-style shape is described as a polar radius function sampled at the same
// angles, so two shapes morph by interpolating radii point-by-point.
import { tokens, type ShapeName } from './tokens';

type Target = {
  kind: 'lobed' | 'superellipse' | 'stadium';
  lobes?: number;
  amplitude?: number;
  sharpness?: number;
  exponent?: number;
  aspect?: number;
};

const N = tokens.shape.morph.samples;
const ANGLES = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2 - Math.PI / 2);

function radiusAt(t: Target, a: number): number {
  switch (t.kind) {
    case 'lobed': {
      const n = t.lobes ?? 0;
      if (!n) return 1;
      const amp = t.amplitude ?? 0;
      if (t.sharpness) {
        // Petals: round leaves with pinched valleys (clover, soft burst).
        const petal = Math.abs(Math.cos((n * a) / 2)) ** t.sharpness;
        return 1 - amp + amp * (2 * petal - 1);
      }
      return 1 - amp + amp * Math.cos(n * a);
    }
    case 'superellipse': {
      const p = t.exponent ?? 4;
      return 1 / (Math.abs(Math.cos(a)) ** p + Math.abs(Math.sin(a)) ** p) ** (1 / p);
    }
    case 'stadium': {
      // Horizontal pill: rectangle half-width 1, half-height h, with semicircular ends.
      const h = t.aspect ?? 0.6;
      const cx = 1 - h;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      // Ray from the centre: intersect with the flat sides, else with the end circle.
      const tFlat = Math.abs(dy) > 1e-6 ? h / Math.abs(dy) : Infinity;
      if (Math.abs(tFlat * dx) <= cx) return tFlat;
      const sx = Math.sign(dx) * cx;
      const b = dx * sx;
      return b + Math.sqrt(b * b - sx * sx + h * h);
    }
  }
}

const cache = new Map<string, number[]>();

/** Unit-radius samples (max radius normalised to 1) for a named morph target. */
export function radii(name: ShapeName): number[] {
  const hit = cache.get(name);
  if (hit) return hit;
  const t = tokens.shape.morph.targets[name] as Target;
  const r = ANGLES.map(a => radiusAt(t, a));
  const max = Math.max(...r);
  const out = r.map(x => x / max);
  cache.set(name, out);
  return out;
}

/** Interpolate two shapes; `t` in 0..1 (values outside allow spring overshoot). */
export function mix(a: ShapeName, b: ShapeName, t: number): number[] {
  const ra = radii(a);
  const rb = radii(b);
  return ra.map((x, i) => x + (rb[i] - x) * t);
}

/**
 * SVG path for a radius array, centred in a `size` box. Uses a closed Catmull-Rom
 * spline converted to cubic Béziers so shapes stay smooth at any size.
 * `rotate` is in radians.
 */
export function pathFromRadii(r: number[], size: number, rotate = 0): string {
  const c = size / 2;
  const pts = r.map((ri, i) => {
    const a = ANGLES[i] + rotate;
    return [c + Math.cos(a) * ri * c, c + Math.sin(a) * ri * c];
  });
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

export const shapePath = (name: ShapeName, size: number, rotate = 0) => pathFromRadii(radii(name), size, rotate);
export const LOADING_SEQUENCE = tokens.shape.morph.loadingSequence as readonly ShapeName[];
