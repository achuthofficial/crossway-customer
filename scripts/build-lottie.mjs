// Generates the Lottie empty-state animations in src/motion/lottie/. Hand-built rather than
// exported from After Effects so they stay tiny, use only brand colours and loop in 2.4 s
// (two loops = 4.8 s, under the 5 s auto-play limit). Run: npm run lottie
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/motion/lottie');
const FR = 30;
const OP = 72; // 2.4 s
const hex = h => [1, 3, 5].map(i => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)).concat(1);
const COL = { primary: hex('#0B57D0'), soft: hex('#D3E3FD'), surface: hex('#E9EEF6'), green: hex('#34A853'), yellow: hex('#FBBC04'), red: hex('#EA4335'), white: hex('#FFFFFF') };

const st = v => ({ a: 0, k: v });
const ease = { o: { x: [0.3], y: [0] }, i: { x: [0.2], y: [1] } };
/** Animated property from [frame, value] pairs, eased between each. */
const anim = (...kf) => ({ a: 1, k: kf.map(([t, s], i) => (i < kf.length - 1 ? { t, s: [].concat(s), ...ease } : { t, s: [].concat(s) })) });
const tr = (o = {}) => ({ ty: 'tr', p: st([0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0), ...o });
const ks = (o = {}) => ({ o: st(100), r: st(0), p: st([100, 100, 0]), a: st([0, 0, 0]), s: st([100, 100, 100]), ...o });
const ellipse = (size, fill, stroke, w = 0) => ({
  ty: 'gr',
  it: [
    { ty: 'el', d: 1, p: st([0, 0]), s: st([size, size]) },
    ...(stroke ? [{ ty: 'st', c: st(stroke), o: st(100), w: st(w), lc: 2, lj: 2 }] : []),
    ...(fill ? [{ ty: 'fl', c: st(fill), o: st(100), r: 1 }] : []),
    tr(),
  ],
});
const path = (v, closed, fill, stroke, w = 0, trim) => ({
  ty: 'gr',
  it: [
    { ty: 'sh', ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v, c: closed }) },
    ...(trim ? [trim] : []),
    ...(stroke ? [{ ty: 'st', c: st(stroke), o: st(100), w: st(w), lc: 2, lj: 2 }] : []),
    ...(fill ? [{ ty: 'fl', c: st(fill), o: st(100), r: 1 }] : []),
    tr(),
  ],
});
let ind = 0;
const layer = (nm, shapes, k = {}) => ({ ddd: 0, ind: ++ind, ty: 4, nm, sr: 1, ks: ks(k), ao: 0, shapes, ip: 0, op: OP, st: 0, bm: 0 });
const doc = (nm, layers) => ({ v: '5.7.4', fr: FR, ip: 0, op: OP, w: 200, h: 200, nm, ddd: 0, assets: [], layers: layers.reverse() });

// 1. Empty shift feed: a magnifier sweeps a soft map while three pins pop up in turn.
ind = 0;
const pin = (x, y, c, t0) =>
  layer('pin', [ellipse(6, COL.white), ellipse(16, c)], {
    p: st([x, y, 0]),
    s: anim([t0, [0, 0, 100]], [t0 + 8, [115, 115, 100]], [t0 + 14, [100, 100, 100]], [OP - 10, [100, 100, 100]], [OP, [0, 0, 100]]),
  });
const search = doc('empty-search', [
  layer('map', [ellipse(150, COL.surface)]),
  layer('roads', [path([[-60, 20], [-10, -10], [30, 10], [62, -18]], false, null, COL.white, 6), path([[-30, -55], [-10, -10], [5, 60]], false, null, COL.white, 6)]),
  pin(62, 78, COL.green, 6),
  pin(128, 72, COL.yellow, 18),
  pin(110, 132, COL.red, 30),
  layer('magnifier', [path([[14, 14], [34, 34]], false, null, COL.primary, 9), ellipse(40, COL.soft, COL.primary, 7)], {
    p: anim([0, [78, 96, 0]], [24, [124, 88, 0]], [48, [108, 126, 0]], [OP, [78, 96, 0]]),
    r: anim([0, 0], [24, 10], [48, -8], [OP, 0]),
  }),
]);

// 2. No saved jobs: a bookmark draws itself, bobs, and a few sparkles twinkle once each.
ind = 0;
const sparkle = (x, y, c, t0) =>
  layer('sparkle', [ellipse(10, c)], { p: st([x, y, 0]), s: anim([t0, [0, 0, 100]], [t0 + 8, [100, 100, 100]], [t0 + 20, [0, 0, 100]]) });
const saved = doc('empty-saved', [
  layer('halo', [ellipse(140, COL.surface)]),
  layer('bookmark', [path([[-26, -38], [26, -38], [26, 38], [0, 18], [-26, 38]], true, COL.soft, COL.primary, 7, { ty: 'tm', s: st(0), e: anim([0, 0], [26, 100], [OP, 100]), o: st(0), m: 1 })], {
    p: anim([0, [100, 104, 0]], [36, [100, 94, 0]], [OP, [100, 104, 0]]),
  }),
  sparkle(146, 62, COL.yellow, 18),
  sparkle(56, 70, COL.green, 30),
  sparkle(140, 140, COL.red, 42),
]);

for (const [n, d] of [['empty-search', search], ['empty-saved', saved]]) {
  writeFileSync(join(OUT, n + '.json'), JSON.stringify(d));
  console.log('wrote', n, JSON.stringify(d).length, 'bytes');
}
