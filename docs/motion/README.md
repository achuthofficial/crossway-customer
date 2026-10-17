# CrossWay motion system

Material 3 Expressive motion for the three CrossWay products, shared through one token file.

| Product | Repo | Stack | Motion scheme | Feel |
|---|---|---|---|---|
| Worker app (candidate) | crossway-customer | Expo (React Native) | expressive | Bold |
| Business portal (client) | crossway-client | React + Vite, Motion, GSAP | expressive | Confident |
| Operations console (admin) | crossway-admin | React + Vite, Motion | standard | Quiet, ≤ 300 ms |

## Where each deliverable lives

| # | Deliverable | Location (same path in every repo unless noted) |
|---|---|---|
| 1 | Tokens: JSON source, TS, CSS, Kotlin | `design-tokens/motion-tokens.json` → `npm run tokens` → `tokens.ts`, `tokens.css`, `MotionTokens.kt`, `color-tokens.json`; shape geometry in `shapes.ts` |
| 2 | Component library | Web: `src/motion/` (AnimatedCard, MorphButton, SharedElement, StaggerList, CountUp, SuccessBurst, SkeletonShimmer, ShapeMorph, IconMorph). Mobile: `src/motion/` (the same set plus SwipeCard, PredictiveBack, ContainerTransformHost, ProgressRing, MorphNavBar, ReferralGraph, FlipList, BadgeFlip, Lottie, Splash) |
| 3 | Screen-by-screen motion spec | [MOTION_SPEC.md](MOTION_SPEC.md) |
| 4 | Hero moments (working code) | Splash, apply success and swipe cards: crossway-customer. Kanban drag: crossway-client `src/screens/Hiring.jsx`. Dashboard load: crossway-admin `src/screens/Dashboard.jsx` |
| 5 | Reduced motion and WCAG 2.2 | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| 6 | Performance checklist and low-end device test plan | [PERFORMANCE.md](PERFORMANCE.md) |

## Springs (from `design-tokens/motion-tokens.json`)

Damping ratio ζ / stiffness k, mass 1. **Spatial** springs move things (position, scale, shape) and may
overshoot when ζ < 1. **Effects** springs change colour, opacity and elevation; they are critically damped (ζ 1)
and never overshoot.

| Scheme | Kind | fast | default | slow |
|---|---|---|---|---|
| expressive | spatial | ζ 0.6 · k 800 | ζ 0.8 · k 380 | ζ 0.8 · k 200 |
| expressive | effects | ζ 1 · k 3800 | ζ 1 · k 1600 | ζ 1 · k 800 |
| standard | spatial | ζ 0.9 · k 1400 | ζ 0.9 · k 700 | ζ 0.9 · k 300 |
| standard | effects | ζ 1 · k 3800 | ζ 1 · k 1600 | ζ 1 · k 800 |

Fallback durations, used where a spring can't apply (dash offsets, keyframe shakes, reduced motion):
short 150 ms, medium 300 ms, long 500 ms. The admin is capped at 300 ms. Stagger: 40 ms per item
(allowed range 30–50 ms), capped at 8 items.

## Using it

```ts
// Web (Motion)
const m = useMotion();
<motion.div animate={{ y: 0 }} transition={m.spatial('fast')} />
<motion.div animate={{ opacity: 1 }} transition={m.effects()} />

// Mobile (Animated)
const m = useMotion();
m.to(value, 1).start();                                  // spatial default spring, native driver
m.to(opacity, 1, { kind: 'effects', delay: m.stagger(i) }).start();
```

Change a value in `motion-tokens.json`, run `npm run tokens`, and copy `design-tokens/` to the other two repos.
The generated files are byte-identical in all three.
