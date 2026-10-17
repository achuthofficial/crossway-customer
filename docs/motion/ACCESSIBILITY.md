# Reduced motion and WCAG 2.2

## How reduced motion is detected

| Product | Source | Where |
|---|---|---|
| Web (client, admin) | `prefers-reduced-motion: reduce` | `MotionConfig reducedMotion="user"` in `src/motion/MotionProvider.tsx`; CSS overrides in `src/motion/motion.css` |
| Mobile | `AccessibilityInfo.isReduceMotionEnabled()` plus the `reduceMotionChanged` event (iOS Reduce Motion, Android "Remove animations"); on web the media query, read synchronously | `src/motion/MotionProvider.tsx` |

`useMotion().reduced` is the single switch. Every token helper honours it, so screens don't branch.

## What changes under reduced motion

Spatial motion is replaced by a short fade. Nothing travels, scales, tilts, bounces or morphs. All functionality
stays: every gesture also has a button, and every state change still shows its end state.

| Moment | Default | Reduced |
|---|---|---|
| Any spatial spring | Spring with overshoot | 150 ms linear fade or change |
| Screen transitions (fade through, shared axis) | Fade + scale / slide | Fade only |
| Splash | Draw → morph → expand | Finished mark fades in and out (~0.6 s) |
| Swipe cards | Tilt while dragging | No tilt; the card still follows the finger (direct manipulation). Save and skip are also buttons and screen-reader actions |
| Container transform | Card surface grows to full screen | Cross-fade |
| Predictive back | Page scales and slides | Page fades as you drag |
| MorphButton | Shape morph + rotating loader | Shape set without travel; label and state still announced |
| Confetti / SuccessBurst | Burst | Not rendered; the check and the toast remain |
| Shape-morph loader | Morph loop | Still shape, announced as "Loading" |
| Lottie empty states | 2 loops | Last frame only |
| Pulses (mic, live dot, map dot) | 3 pulses | None |
| Badge flip | 3D flip + shine | Cross-fade, no shine |
| Nav pill | Stretch and bounce | Slides without stretch; icon fills without bounce |
| Kanban drag (client) | Tilt + lift | No tilt; lift shadow only |
| GSAP product tour (client) | Pinned scroll story | Static finished board and all captions, no pinning |
| Theme toggle (web) | Circular reveal | Instant switch |
| Skeleton shimmer | Moving highlight | Still bars, then crossfade |

## WCAG 2.2 checklist

| Criterion | Requirement | How it's met | Status |
|---|---|---|---|
| 2.3.1 Three Flashes or Below Threshold (A) | No more than 3 flashes per second | No element flashes. Bursts fire once per action; the hired-column pop runs once; `tokens.accessibility.maxFlashesPerSecond = 3` is documented for designers | ✅ |
| 2.3.3 Animation from Interactions (AAA) | Motion triggered by interaction can be turned off | All motion respects the OS / browser reduce-motion setting (table above) | ✅ |
| 2.2.2 Pause, Stop, Hide (A) | Auto-playing motion over 5 s needs a pause control | Nothing loops past 5 s: Lottie stops after whole loops within 5 s (4.8 s); pulses run 3 × 1.6 s; the web live-dot runs 2 × 1.6 s; the network glow runs 2 × 1.2 s; the selfie scan makes one 2.8 s pass. Loaders run only while work is in progress | ✅ |
| 2.5.1 Pointer Gestures (A) | Path gestures need a single-pointer alternative | Swipe save/skip: bookmark button, "Not interested" button, `accessibilityActions`. Predictive back: back arrow and system back. Pull to refresh: Refresh button. Kanban drag: stage buttons on every card | ✅ |
| 2.5.7 Dragging Movements (AA, new in 2.2) | Dragging has a non-drag alternative | Same as 2.5.1: every drag (kanban, swipe, edge back) has a button | ✅ |
| 2.5.8 Target Size, Minimum (AA, new in 2.2) | Targets at least 24 × 24 px | Icon buttons are 40–48 px; nav items fill an 80 px bar | ✅ |
| 4.1.3 Status Messages (AA) | State changes are announced | Toasts use `role="status"` / `accessibilityLiveRegion`; MorphButton announces "in progress" and the success label; CountUp exposes the final value | ✅ |
| 2.4.11 Focus Not Obscured (AA, new in 2.2) | Focus isn't hidden by overlays | Toasts sit above the nav and don't trap focus; sheets and dialogs are modal | ✅ |
| 1.4.3 Contrast (AA) | Text contrast at least 4.5:1 | Colours come from Material dynamic-colour roles generated from the seed, in light and dark (web) | ✅ (dark mode on mobile not yet wired) |

## Manual test steps

1. **iOS:** Settings → Accessibility → Motion → Reduce Motion on. **Android:** Settings → Accessibility → Remove animations on. **Web:** DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`.
2. Walk the flows in MOTION_SPEC.md and confirm each row behaves as in the table above.
3. With TalkBack or VoiceOver, swipe to a shift card and use the actions rotor: "Save for later" and "Not interested" must work.
4. Confirm nothing moves for more than 5 s without interaction (time the empty-state Lottie, pulses and the glow).
