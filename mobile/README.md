# mobile

Expo / React Native client targeting Android and iOS, per
[docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md). Scaffolded
with `create-expo-app`'s `tabs` template (Expo Router, TypeScript).

- `src/collectors/` — all four MC-01..MC-04 collectors, normalized to the `SignalIn` schema and posted to `/signals`:
  - `network_activity` (MC-04) — Expo-safe, pure JS (`expo-network`)
  - `installed_app` / `permission` (MC-02 / MC-01) — via the local native module in `modules/device-inventory/`, scoped to non-system (user-installed) packages only
  - `scheduled_job` (MC-03) — self-reported only: the app reports its own background-task registration state (`expo-task-manager` + `expo-background-task`), not other apps' jobs — see "Scheduled-job collector scope" below
- `src/lib/signalQueue.ts` — MC-05: buffers signals locally and retries when the backend is unreachable, instead of dropping them
- `modules/device-inventory/` — local Expo module (Android-only, Kotlin): wraps `PackageManager.getInstalledPackages(GET_PERMISSIONS)` to enumerate installed packages and their granted permissions
- `src/api/` — typed client for the backend API surface (`/signals`, `/alerts`, `/hunt`, `/reports/ir`), shared bearer auth, explicit 401 handling
- `src/screens/` — Preflight, Dashboard, Hunt, IR report views; `app/preflight.tsx` and `app/(tabs)/` route files re-export these

Dashboard UI/UX scope was pending confirmation with the professor (M1 in
[docs/planning/action-plan.md](../docs/planning/action-plan.md)) — now
confirmed, unblocking Part 1.

### Scheduled-job collector scope

Android doesn't let a third-party app enumerate *other* apps'
AlarmManager/WorkManager jobs without root or an accessibility service, so
MC-03 reports the SOC app's own scheduled background work only. For the PoC
kill chain's own scheduled job (T1603), `adb shell dumpsys jobscheduler`
stays the manual evidence path in the video walkthrough — that's expected,
not a gap.

### Requires a dev-client rebuild

`modules/device-inventory/` is native Kotlin code and `expo-task-manager`
is a new native dependency, so a build that predates this change won't have
them linked. Installed-app/permission and scheduled-job collection will
silently no-op (network_activity still posts fine — collectors degrade
independently) until you queue a new EAS dev-client build and reinstall it:

```bash
npx eas-cli build --profile development --platform android
```

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

Preflight, Dashboard, Hunt, and IR Report are all wired up: Preflight checks
backend target/key/health before collection starts; Dashboard's "Collect &
Post Signals" button runs all four collectors and posts the batch to
`/signals` (buffering locally if the backend is unreachable) and shows the
live `/alerts` feed; Hunt runs analyst-supplied queries against `/hunt`; IR
Report generates a real report via `/reports/ir`. See `BUILD-BRIEF.md` at the
repo root for the original demo build's scope and non-goals — the
permission/installed-app/scheduled-job collectors it deferred are now built,
per [docs/product/moscow.md](../docs/product/moscow.md)'s MC-01/MC-02/MC-03.

## Structure notes

- `app/` — Expo Router route files. Kept thin: each route just re-exports the
  matching screen from `src/screens/`.
- `src/screens/` — actual screen implementations.
- `components/` — shared UI primitives from the template (`Themed` for
  light/dark `Text`/`View`, color-scheme hooks) — reused across screens rather
  than duplicated.
- `modules/` — local Expo native modules (currently just `device-inventory`).
  Linked into `mobile/package.json` via a `file:` dependency; EAS's remote
  prebuild step picks it up automatically the same way it would a published
  npm package, no manual native-project wiring needed.
