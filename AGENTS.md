This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & state

This prototype keeps navigation in app state instead of Expo Router: onboarding steps, the five tabs, sub-pages and
bottom sheets are driven by `src/store.js` so the demo controls can jump to any scenario in one tap. If the app grows
real routes, move to Expo Router (`src/app/`), following https://docs.expo.dev/router/introduction.md.

## Animations

Use the React Native `Animated` API and `LayoutAnimation` (via `animateNext()` in `src/store.js`). Shared animated
building blocks live in `src/components/ui.js`. Pass `useNativeDriver: ND` so the web export keeps working.
