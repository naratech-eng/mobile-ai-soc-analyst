# mobile

Expo / React Native client targeting Android and iOS, per
[docs/engineering/tech-stack.md](../docs/engineering/tech-stack.md).

- `src/collectors/` — permissions, installed apps, scheduled jobs, network activity (MC-01..MC-04), normalized to the `Signal` schema and posted to `/signals`
- `src/api/` — typed client for the backend API surface
- `src/screens/` — Dashboard, Hunt, IR report views

Dashboard UI/UX scope is pending confirmation with the professor (M1 in
[docs/planning/action-plan.md](../docs/planning/action-plan.md)); collector
plumbing is architecture-locked and does not wait on that.
