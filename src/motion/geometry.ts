import { tokens, type ShapeName } from '../../design-tokens/tokens';
import { radii } from '../../design-tokens/shapes';

export { radii, mix, shapePath, LOADING_SEQUENCE } from '../../design-tokens/shapes';

const N = tokens.shape.morph.samples;
export const ANGLES = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2 - Math.PI / 2);

/** Distance from the centre to the edge of a w×h pill along each sample angle, in px. */
export function pillRadii(w: number, h: number): number[] {
  const hw = w / 2;
  const hh = h / 2;
  const cx = Math.max(0, hw - hh);
  return ANGLES.map(a => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const tFlat = Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity;
    if (Math.abs(tFlat * dx) <= cx) return tFlat;
    const sx = Math.sign(dx) * cx;
    const b = dx * sx;
    return b + Math.sqrt(b * b - sx * sx + hh * hh);
  });
}

/** A named shape scaled to radius `r` px. */
export const shapeRadii = (name: ShapeName, r: number) => radii(name).map(x => x * r);

export const lerp = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);

/** Closed Catmull-Rom path through px radii around (cx, cy); `rotate` in radians. */
export function pathAround(r: number[], cx: number, cy: number, rotate = 0): string {
  const pts = r.map((ri, i) => [cx + Math.cos(ANGLES[i] + rotate) * ri, cy + Math.sin(ANGLES[i] + rotate) * ri]);
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Rotate a radius array by `phi` radians (fractional sample shift), leaving the frame fixed. */
export function rotateRadii(r: number[], phi: number): number[] {
  const n = r.length;
  const k = ((phi / (Math.PI * 2)) * n) % n;
  return r.map((_, i) => {
    const x = (i - k + n) % n;
    const i0 = Math.floor(x);
    const f = x - i0;
    return r[i0] * (1 - f) + r[(i0 + 1) % n] * f;
  });
}
