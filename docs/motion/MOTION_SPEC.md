# Motion spec, screen by screen

Each row reads **trigger → element → property → spring token → approximate settle time / fallback**.
Token names are `kind.speed`, for example `spatial.fast` or `effects.default`, resolved in the product's
scheme. Settle times are approximate (2 % band) and listed so reviewers can check the budget at a glance.

| Token | Expressive settle | Standard (admin) settle |
|---|---|---|
| spatial.fast | ~240 ms, small overshoot (ζ 0.6) | ~120 ms |
| spatial.default | ~260 ms, slight overshoot (ζ 0.8) | ~170 ms |
| spatial.slow | ~350 ms, slight overshoot | ~260 ms |
| effects.fast / default / slow | ~90 / 150 / 200 ms, no overshoot | same |

Rules that apply everywhere:
- Only `transform` and `opacity` animate. Colour changes use an overlay whose opacity animates. Progress bars use
  `scaleX`. Height changes use table/list `layout` animation (FLIP), which is itself a transform.
- Motion always explains a change of place or state: where something came from, where it went, or what it became.
- Under reduced motion every spatial row becomes a 150 ms opacity fade (see ACCESSIBILITY.md).

---

## Worker app (crossway-customer, expressive, bold)

### Launch
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| App start | Two route strokes | strokeDashoffset 1 → 0 | tween 560 ms emphasized-decelerate | Second route starts 15 % later so they visibly cross |
| Routes drawn | Mark shape | path morph none → cookie9 → squircle | spatial.slow | Routes turn white as the shape fills behind them |
| +120 ms | Squircle | scale 1 → covers screen (container transform) | spatial.slow | Hands off to the first screen |
| Same time | Splash layer | opacity 1 → 0 | effects.slow, +180 ms delay | Tap anywhere skips |

### Onboarding (language → phone → OTP → mode → KYC → selfie → bank)
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Next / Back step | Screen | translateX ±30 → 0 + opacity | spatial.default + effects.default | Shared axis X; direction follows travel |
| Wrong OTP / mismatch | Input row | translateX shake | tween 400 ms | Keyframes, so a tween rather than a spring |
| KYC fetching | Indicator | shape morph cookie → clover → pill → burst → squircle | 650 ms per step | Stops when loading ends |
| Selfie screen | Scan line | translateY down and back | one 2.8 s pass, then rests | Under the 5 s auto-play limit |

### Home: shift feed
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Feed appears | Cards | translateY 28 → 0, scale 0.94 → 1, opacity | spatial.default + effects.default, stagger 40 ms (max 8) | AnimatedCard |
| Horizontal drag | Card | translateX follows finger, rotate ±7° | direct manipulation | Rubber band past 30 % of width: `t + 56·(1 − 1/(over/56 + 1))` |
| Drag crosses 30 % | "Save" / "Skip" backing | opacity, icon scale 0.6 → 1.15 | follows drag | Haptic tick at the threshold, each direction |
| Release past threshold or flick | Card | translateX → ±115 % | spatial.fast with release velocity | Haptic commit, then saved or skipped |
| Release before threshold | Card | translateX → 0 | spatial.fast | Snaps back |
| Item leaves list | Neighbours | layout reflow | LayoutAnimation spring (damping 0.8) | |
| Tap card body | Surface | container transform: translate + scaleX/Y from card bounds to full screen | spatial.default | Detail fades in on top (effects.default, +120 ms) |
| Back from detail | Surface | full screen → card's new bounds | spatial.default | Re-measures the card after the list remounts |
| Pull to refresh / Refresh button | Indicator | translateY −60 → 12, scale 0.6 → 1, then shape morph | spatial.default in, spatial.fast out | Native spinner hidden |
| Empty feed | Lottie (map + magnifier) | 2.4 s loop | — | Two loops (4.8 s) then rests on the last frame; tap replays |

### Shift sheet: accept
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Sheet opens | Sheet | translateY 500 → 0, scrim opacity | spatial.default, scrim clamped | |
| Confirm shift | Button | SVG path pill → cookie9 (rotating) | spatial.default | Container keeps its size; nothing reflows |
| Server OK | Button | cookie9 → circle; check stroke draws | spatial.fast; check tween 320 ms | Success haptic |
| Same time | Confetti | 22 brand-colour particles: translate, rotate, opacity | tween 0.9–1.2 s | One burst. Skipped under reduced motion |

### Job detail
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Opens | Header block | opacity + translateY | effects/spatial default | Arrives after the container transform |
| Opens | Fact rows | stagger rise | spatial.default, 40 ms | |
| Edge swipe from left | Page | scale 1 → 0.9, translateX up to 8 %, corners round; previous screen fades in behind | follows finger | Predictive back with a live preview; haptic tick at 32 % |
| Release past 32 % / Android back | Page | slides out, opacity → 0 | spatial.fast | Commit haptic. Detail closes into its card instead |

### Navigation bar
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Tab change | Indicator pill | translateX, scaleX stretch | leading edge spatial.fast, trailing edge spatial.slow | Stretches toward the new tab, lands as a pill |
| Tab change | Icon | outlined → filled crossfade; scale 0.7 → 1 | effects.fast; spatial.fast (bounce) | Haptic tick |
| Tab change | Screen | opacity + scale 0.96 → 1 | effects.default + spatial.default | Fade through |

### Passport
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Opens / item added | Completeness ring | strokeDashoffset | spatial.slow | |
| Crosses 25/50/75/100 % | Ring | scale 1 → 1.12 → 1 | spatial.fast → spatial.default | Haptic tick; success haptic at 100 % |
| Tap locked badge | Badge | rotateY 0 → 180° (perspective 800) | spatial.slow | Success haptic and confetti |
| Flip lands | Shine | translateX across, rotated 18° | tween 650 ms standard | Once |
| Opens | Reliability ring | strokeDashoffset 0 → 94 % | spatial.slow | |

### Refer and earn
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Opens | Network lines | draw from you → friends → their friends | 1.6 s emphasized | Ordered by depth |
| Line arrives | Node | scale with back-out pop | follows the line | |
| Lines drawn | Glow | opacity 0.12 ↔ 0.30 | 2 × 1.2 s, then steady | Under the 5 s limit |
| Referral added | Leaderboard rows | translateY to new rank (FLIP) | spatial.default | Rising row draws above the others |

### Career mode
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Apply in one tap | MorphButton | pill → loading → check | as Confirm shift | Confetti and success haptic; then the application appears in Applied |
| Application stage | Stage bars | scaleX | spatial.slow | |

### Wallet
| Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|
| Balance changes | Amount | count from old to new | tween 700 ms emphasized-decelerate | `accessibilityLabel` holds the final value |
| Transaction added | List | LayoutAnimation | spring damping 0.8 | |

---

## Business portal (crossway-client, expressive, confident)

| Screen | Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|---|
| Product tour (`#/welcome`) | Scroll (scrubbed) | Candidate chips | x/y from talent pool → Shortlisted → Interviewing → Offered → Hired | GSAP ScrollTrigger, scrub 0.6, power2.inOut | Stage pinned for 2,400 px. Reduced motion shows the finished board, no pin |
| | Scroll | Captions | opacity + y ±16 | 0.3 of the timeline | Four steps |
| | Hired | Hired column | scale 1 → 1.04 → 1, once | 0.2 yoyo | Single pop, no flashing |
| All | Destination change | Screen | opacity + scale 0.97 → 1 | spatial.default, effects.default; exit effects.fast | Fade through |
| Rail | Destination change | Indicator pill | layoutId move | spatial.fast | Badges pop with spatial.fast |
| Hiring (kanban) | Drag start | Card | scale 1.04; elevation layer opacity → 1 | effects.fast | Lift |
| | Dragging | Card | rotate ±8° from horizontal velocity | spring k380 / damping 30 | Tilt settles when the card stops |
| | Over a column | Placeholder | scaleY 0.6 → 1, opacity | spatial.fast | Neighbours reflow (layout FLIP) |
| | Drop | Card | layout move into the column | spatial.default | Same rules as the buttons: one stage forward |
| | Drop on Hired | Burst | brand particles | ~1 s | One burst; count badge pops |
| | Tap a candidate | Avatar and name | shared element (layoutId) card → profile dialog | spatial.default | Details fade in +120 ms |
| Post a job | Next / Back | Step panel | x ±40 + opacity | spatial.default | Shared axis X; direction follows travel |
| | Step change | Progress bar | scaleX | spatial.default | `role=progressbar` |
| | Post | MorphButton | pill → loading → check | spatial | |
| Invoices / Pay | Pay | MorphButton | loading → error shake (first try) → success | spatial; shake tween 320 ms | |
| Live, Workers, Invoices | First visit | Skeleton | shimmer (transform) → content crossfade | effects.default | 650 ms on first load only |
| Theme toggle | Click | Page | circular clip-path reveal from the button | View Transitions, 450 ms emphasized-decelerate | Instant under reduced motion |
| Toast | New message | Toast | y 40 → 0, opacity | spatial.fast, effects.fast | |

---

## Operations console (crossway-admin, standard, quiet)

Nothing celebrates, nothing bounces (ζ 0.9) and everything settles in about 300 ms or less.

| Screen | Trigger | Element | Property | Token | Notes |
|---|---|---|---|---|---|
| Dashboard | Load | KPI tiles | stagger rise + opacity | spatial.default, 40 ms | |
| | Load / data change | KPI numbers | count up | 300 ms emphasized-decelerate | Starts when in view |
| | Load | Bar chart | scaleY 0 → 1 from baseline | spatial.slow, 40 ms stagger | Draws in |
| | Load | Mix bars | scaleX 0 → 1 | spatial.slow, 40 ms stagger | |
| Candidates | Sort by column | Rows | layout FLIP | spatial.default | Header arrow rotates; `aria-sort` updates |
| Verification | Approve | MorphButton | compact → check | spatial.fast | Row exits 450 ms later |
| | Row leaves | Row | height → 0 + opacity | spatial.default | |
| Finance | Audit entry added | Row | height + opacity in; highlight overlay fades | spatial.default / effects | |
| Ops: fraud | Decide | Icon | gavel → check morph | effects.fast | Row removed after 420 ms |
| Ops: config | Invalid save | Field | shake | tween 320 ms | |
| Any table | Insert / delete | Rows | height + fade | spatial.default | |
| Navigation rail | Expand / collapse | Rail | layout width, labels fade | spatial.default | State kept in `localStorage` |
| | Destination change | Indicator | layoutId pill | spatial.fast | |
| Any action | Result | Toast | y 40 → 0 from the bottom | spatial.fast | |
| Theme toggle | Click | Page | circular reveal | 300 ms | |
