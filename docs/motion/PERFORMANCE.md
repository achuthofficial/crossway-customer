# Performance checklist and low-end device test plan

Target: 60 fps on a mid-range Android phone (for example a 2021 Snapdragon 680 or Helio G85 class device, 4 GB RAM),
and input that never waits on an animation.

## Checklist

### All products
- [x] Animate only `transform` and `opacity`. Colour changes use an overlay's opacity; bars use `scaleX`/`scaleY`;
      list changes use FLIP (layout → transform).
- [x] Every animation is interruptible. Springs retarget from the current value and velocity; nothing waits for an
      animation to finish before accepting the next tap.
- [x] Stagger is capped at 8 items (40 ms each), so a long list never takes more than ~320 ms to settle.
- [x] Loops are bounded (see ACCESSIBILITY.md); loaders stop when their work ends.
- [x] Reduced motion takes the cheap path (fades only).

### Web (client, admin)
- [x] Motion (`motion/react`) runs transform and opacity animations on the compositor where the browser allows it.
- [x] `will-change: transform` only on elements that move continuously (landing chips, skeleton highlight), not globally.
- [x] GSAP ScrollTrigger uses `scrub` (no scroll listeners doing layout), `invalidateOnRefresh`, and is scoped with
      `gsap.context` and reverted on unmount.
- [x] Skeleton shimmer is a translated pseudo-element, not an animated `background-position`.
- [x] Theme toggle uses the View Transitions API (one GPU snapshot), not per-element colour transitions.
- [ ] Budget: under 4 ms of scripting per frame during the kanban drag (check in the Performance panel with 4× CPU throttling).

### Mobile (Expo)
- [x] `useNativeDriver: true` for every transform and opacity animation (`ND`); these run on the UI thread even when
      JS is busy.
- [x] Swipe and edge-back gestures write straight to an `Animated.Value` (`setValue`), with no React re-render per frame.
- [x] JS-driven animations are limited to SVG properties the native driver can't reach (shape-morph paths, dash
      offsets, the referral graph) and are short or bounded: MorphButton ~1 s, splash ~1.6 s, graph 1.6 s + 2.4 s glow.
- [x] Shape morphs use 96 samples and one `<Path>`; at that size a re-render is well under 1 ms.
- [x] The pull-to-refresh loader only renders while refreshing.
- [x] Lottie: Skia's Skottie on native (no extra native module, works in Expo Go), lottie-web on web; each file is
      under 7 KB; playback stops after its loops.
- [x] Confetti uses 22 native-driver views for about 1 s, then unmounts.
- [x] `LayoutAnimation` only for one-off list inserts and removals.
- [ ] Release-build profiling on a low-end device (plan below). The checks here were made on the web export and
      the Android bundle build; no physical device was available.

## Low-end device test plan

### Devices
| Tier | Example | Why |
|---|---|---|
| Low | Android Go phone, 2 GB RAM (Snapdragon 425 / Helio A22) | Worst case for the JS thread |
| Mid (target) | Redmi Note 10 / Galaxy A13, 4 GB | The 60 fps target |
| iOS baseline | iPhone SE (2nd gen) | Oldest supported Metal device |
| Web low-end | Chrome with 6× CPU throttling and "Low-end mobile" network | Client and admin |

### Setup
1. Use a **release** build (`npx expo run:android --variant release`, or an EAS preview build). Dev builds run JS
   much slower and aren't representative.
2. Turn on Developer options → Profile HWUI rendering → On screen as bars, plus the React Native Perf Monitor
   (dev menu → Perf Monitor) for UI and JS fps.
3. Battery saver off; then repeat the key runs with battery saver on.

### Scenarios (each run 5 times; record the median and worst)
| # | Scenario | Pass criteria |
|---|---|---|
| 1 | Cold start through the splash to Language | UI ≥ 55 fps; splash finishes ≤ 1.8 s; tap-to-skip responds within 100 ms |
| 2 | Scroll the shift feed while cards are still entering | UI ≥ 58 fps; no dropped touches |
| 3 | Swipe 10 cards quickly, alternating save and skip | Card tracks the finger with no visible lag; haptic fires at the threshold every time |
| 4 | Open and close job detail 10 times (container transform) | ≤ 2 janky frames per transition; returns into the right card |
| 5 | Edge-swipe back, abort halfway, then commit | Preview follows the finger; aborting springs back cleanly |
| 6 | Confirm a shift (morph + confetti) while the JS thread is busy (spam taps on the nav bar) | Confetti and transforms stay smooth (native driver); the morph may drop frames on Low tier but must finish |
| 7 | Switch tabs rapidly 20 times | Pill never desyncs from the selected tab; no stuck states |
| 8 | Refer page: graph draw + 3 leaderboard updates | JS ≥ 45 fps on Low, ≥ 55 on Mid |
| 9 | Empty-state Lottie (Skottie) | UI ≥ 55 fps; stops by 5 s |
| 10 | Turn on Reduce motion / Remove animations and repeat 1–9 | All flows complete; nothing slides or bounces |
| 11 | Web client: drag a kanban card across 3 columns at 6× throttling | ≥ 50 fps; drop lands in the right column |
| 12 | Web client: scroll the product tour top to bottom at 6× throttling | No layout shift; chips stay in their columns |
| 13 | Web admin: sort the candidates table 10 times | Each FLIP settles within 300 ms |

### Logging results
Record device, OS, build, scenario, median and worst fps, and notes in a table in the PR. A scenario that misses its
criteria gets an issue with a Perfetto (Android) or Instruments (iOS) trace attached.

### Known trade-offs
- Shape morphs, dash offsets and the referral graph run on the JS thread (react-native-svg props can't use the
  native driver). They are short and bounded. If Low-tier tests miss their targets, move them to Reanimated (already
  supported by Expo Go) or render them with Skia paths.
- Lottie on native re-renders the Skia canvas once per frame while playing (at most 4.8 s).
