# CrossWay worker app (customer)

Android-first mobile app for CrossWay workers and candidates, built with **React Native + Expo (SDK 58)**. It has two
modes in one account: **Work Now** (shifts near you, daily pay) and **Career** (permanent jobs, interviews). Everything
runs on device with demo data; there is no backend.

## Run

```bash
npm install
npm start            # Expo dev server: scan the QR code with Expo Go, or press a / i / w
npm run android      # Android emulator or device
npm run ios          # iOS simulator
npm run build:web    # static web build in dist/ (any static host can serve it)
```

Prototype codes: OTP `123456`.

## What's inside

- **Onboarding (M1, M2)**: 10 languages, phone + OTP (3 tries, resend cooldown), Work Now vs Career, DigiLocker KYC with
  offline-XML fallback and under-18 block, selfie liveness with video-check fallback, UPI verification with name-mismatch flow.
- **Home (M4, M5)**: availability switch, voice search, filters, shift feed with clash, far-away, police-verification
  and "someone took it" cases; offline and low-data modes.
- **My shifts and shift day (M6)**: geofenced check-in, supervisor confirmation, offline ticket, check-out, rating, SOS.
- **Wallet (M7)**: UPI withdrawals with limits and bank-down failure, earned-wage advance capped at 50%.
- **Passport (M12)**: verified profile, Reliability Score with breakdown and appeal, badges.
- **Career (M8)**: matched jobs, one-tap apply, AI-interview consent, human review, offers.
- **More**: refer and earn, help and anonymous complaints, Student Ambassador, my data, language, low-data mode.
- **Demo controls** (More → Demo controls): switch scenarios (DigiLocker down, selfie fails, bank mismatch, outside the
  geofence, payout failure, empty feed) and jump to any of the 26 edge cases.

## QR check-in, breaks and check-out

On **Today's shift**, the worker scans the site's CrossWay QR at the entrance to check in (expo-camera), takes a break
from the app, and scans again to check out. The client is notified at each step.

- **Rotating QR:** the client portal shows a QR that changes every 30 s. Each payload is signed and time-boxed, so a
  photo of it is useless a minute later. The app rejects expired codes, codes from another site and edited codes,
  and says why.
- **Fallback code:** the 6-digit code under the QR works when the camera is denied or unavailable.
- **Offline:** QRs are checked on the phone, so check-in works with no signal and syncs later.
- **Breaks:** the allowance the client set for the site (30 min by default, longer if the client chooses) counts down
  on a ring. An overrun is shown to the worker and reported to the client.
- **Demo controls:** "Site QR scan" (valid / expired / wrong site) and "Break set by client" (30 / 45 / 60), plus
  four new edge cases.
- **Shared code:** the QR format lives in `src/lib/checkinQr.js`, identical to the copy in crossway-client. Without
  a backend it signs with a demo key; production should issue and verify codes server-side with HMAC.

## Motion (Material 3 Expressive)

All motion uses spring tokens from `design-tokens/` (shared with the web apps) through the TypeScript library in
`src/motion/`. It runs in Expo Go: Animated with the native driver, react-native-svg, expo-haptics, and Skia's Skottie
for Lottie (lottie-web on web).

- **Splash:** two routes draw and cross, a cookie shape morphs into the app squircle, then a container transform
  expands into the first screen.
- **Shift cards:** staggered spring entrance. Swipe right to save or left to skip, with rubber-band resistance, tilt
  and a haptic tick at the threshold. The bookmark button and screen-reader actions do the same.
- **Card → job detail:** container transform there and back.
- **Confirm shift / Apply:** pill → loading shape → check, brand-colour confetti and a success haptic.
- **Passport:** profile-completeness ring that springs and pulses at 25/50/75/100 %; a badge that flips in 3D with
  a shine sweep.
- **Refer and earn:** network graph with glowing lines and a FLIP leaderboard.
- **Navigation bar:** stretching indicator pill; icons switch outlined → filled with a bounce.
- **Pull to refresh** (or the Refresh button): shape-morphing loader.
- **Empty states:** Lottie, two 2.4 s loops then still (`npm run lottie` regenerates them).
- **Predictive back:** edge-swipe with a live preview on every sub-page; Android back runs the same exit.
  `predictiveBackGestureEnabled` is on in `app.json`.
- **Reduced motion:** follows the OS setting; spatial motion becomes fades and everything still works.

Spec, accessibility and performance docs: [`docs/motion/`](docs/motion/README.md).

## Structure

```
App.js                    root, screen transitions, tab bar, overlays
src/store.js              all app state and scenario jumps
src/data.js               demo data and translations
src/theme.js              colours
src/components/ui.js      icons, buttons, animated primitives (on top of src/motion)
src/components/Overlays.js  bottom sheet, toast, navigation bar
src/motion/               motion library (TypeScript): springs, haptics, MorphButton, SwipeCard,
                          ContainerTransform, PredictiveBack, ShapeMorph, Lottie, Splash, …
design-tokens/            shared motion, shape and colour tokens (npm run tokens)
scripts/build-lottie.mjs  generates the Lottie empty states
src/screens/              Onboarding, Home, Tabs, Sub (shift day, info pages, demo controls)
```
