# mobile

Expo / React Native client targeting Android and iOS, per
[docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md). Scaffolded
with `create-expo-app`'s `tabs` template (Expo Router, TypeScript).

- `src/collectors/` — permissions, installed apps, scheduled jobs, network activity (MC-01..MC-04), normalized to the `Signal` schema and posted to `/signals`
- `src/api/` — typed client for the backend API surface
- `src/screens/` — Dashboard, Hunt, IR report views; `app/(tabs)/` route files re-export these

Dashboard UI/UX scope was pending confirmation with the professor (M1 in
[docs/planning/action-plan.md](../docs/planning/action-plan.md)) — now
confirmed, unblocking Part 1.

## Run locally

**Plain Expo Go doesn't work here.** The published Expo Go app on the App
Store lags the SDK version `create-expo-app` scaffolds — this project hit an
"incompatible SDK" error on a real device (Expo Go capped at SDK 54, project
on SDK 57) on the very first scaffold. Instead this project uses
[`expo-dev-client`](https://docs.expo.dev/develop/development-builds/introduction/) +
an [EAS Build](https://docs.expo.dev/build/introduction/) (development
profile) — a real installable build with no SDK version lock, and no local
Android SDK/Xcode toolchain required to produce it. Config lives in
`eas.json`.

One-time setup (per developer):

```bash
cd mobile
npm install
npx eas-cli login              # your own Expo account
npx eas-cli build --profile development --platform android
```

That queues a cloud build (no local Android SDK needed) and gives you a
download link/QR for an installable `.apk`. Install it once on your target
device, then for every session after that:

```bash
npx expo start --dev-client
```

**Testing target: Android emulator (Genymotion), not iOS.** A physical-iPhone
dev-client build needs an Apple Developer Program membership ($99/year) for
EAS to sign it — see the note in
[docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md). Android
has no equivalent paywall, so that's the target until/unless an Apple
Developer account is added to the project. The Genymotion emulator already
set up for the offensive PoC (`poc-apk/`) is the intended test device — same
lab environment.

The three tabs (Dashboard, Hunt, IR Report) are scaffolded as placeholder
screens for now — collectors, the API client, and live data wire up in later
slices (see `BUILD-BRIEF.md` at the repo root while it's being built out).

## Structure notes

- `app/` — Expo Router route files. Kept thin: each route just re-exports the
  matching screen from `src/screens/`.
- `src/screens/` — actual screen implementations.
- `components/` — shared UI primitives from the template (`Themed` for
  light/dark `Text`/`View`, color-scheme hooks) — reused across screens rather
  than duplicated.
