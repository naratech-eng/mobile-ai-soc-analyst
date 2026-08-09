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

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or press `w` to open the web
target. The three tabs (Dashboard, Hunt, IR Report) are scaffolded as
placeholder screens for now — collectors, the API client, and live data wire
up in later slices (see `BUILD-BRIEF.md` at the repo root while it's being
built out).

## Structure notes

- `app/` — Expo Router route files. Kept thin: each route just re-exports the
  matching screen from `src/screens/`.
- `src/screens/` — actual screen implementations.
- `components/` — shared UI primitives from the template (`Themed` for
  light/dark `Text`/`View`, color-scheme hooks) — reused across screens rather
  than duplicated.
