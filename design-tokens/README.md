# CrossWay design tokens

One source of truth for motion, shape and colour, shared by all three CrossWay apps
(candidate mobile app, client web app, admin web app). The same folder is vendored into
each repo; keep them identical.

| File | What it is |
| --- | --- |
| `motion-tokens.json` | **Source.** Springs, durations, easing, stagger, shapes, colour seed, accessibility limits. Edit this. |
| `build.mjs` | Generator. Run `npm run tokens` after editing the JSON. |
| `tokens.ts` | Generated TypeScript constants and helpers (`spring()`, `staggerDelay()`, `cssEasing()`). |
| `tokens.css` | Generated CSS custom properties: `--md-sys-color-*` for light and dark, `--md-motion-*`, `--md-shape-corner-*`. |
| `color-tokens.json` | Generated Material You light/dark schemes from the seed `#0B57D0` (Fidelity variant keeps the brand blue). |
| `MotionTokens.kt` | Generated Jetpack Compose constants for a native Android build. |
| `shapes.ts` | Shape-morph geometry (cookie, clover, pill, squircle, soft burst) for SVG paths. |

## Springs

Material 3 MotionScheme values. `damping` is the coefficient Motion, React Native `Animated`
and Reanimated expect, computed as `dampingRatio · 2√stiffness` (mass 1).

| Scheme | Kind | Fast | Default | Slow |
| --- | --- | --- | --- | --- |
| expressive (mobile, client) | spatial (position, size, shape; may overshoot) | ζ 0.6 · k 800 | ζ 0.8 · k 380 | ζ 0.8 · k 200 |
| expressive | effects (colour, opacity, elevation; never overshoot) | ζ 1 · k 3800 | ζ 1 · k 1600 | ζ 1 · k 800 |
| standard (admin) | spatial | ζ 0.9 · k 1400 | ζ 0.9 · k 700 | ζ 0.9 · k 300 |
| standard | effects | ζ 1 · k 3800 | ζ 1 · k 1600 | ζ 1 · k 800 |

Use **fast** for small elements (chips, icons, switches), **default** for cards and sheets,
**slow** for full-screen transitions.
