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

## Animations

Built with React Native's `Animated` API and `LayoutAnimation`, so it runs in Expo Go with no native setup: screen and tab
transitions, a sliding tab indicator, spring-press buttons, bottom sheets, snackbars, staggered card entrances, a
pulsing voice mic, a selfie scan line, an animated availability switch, wallet count-up, progress bars and a moving
location dot on the shift map.

## Structure

```
App.js                    root, screen transitions, tab bar, overlays
src/store.js              all app state and scenario jumps
src/data.js               demo data and translations
src/theme.js              colours
src/components/ui.js      icons, buttons, animated primitives
src/components/Overlays.js  bottom sheet, toast, tab bar
src/screens/              Onboarding, Home, Tabs, Sub (shift day, info pages, demo controls)
```
