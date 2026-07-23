# Security model

How the system itself is secured, and the controls that protect its assets. Threats and what is being tested are in the [Threat Model](threat-model.md).

> Safety framing: all offensive execution referenced here is a **self-built benign proof-of-concept**, run only in an **isolated lab** against infrastructure **under my control** — **never** on a personal device, and no in-the-wild malware.

## Security objectives
- **Confidentiality** — on-device signals and analyst data are not exposed in transit or at rest beyond need.
- **Integrity** — alerts, technique mappings, and IR reports cannot be silently tampered with.
- **Availability** — signal ingestion and alerting remain functional under transient failures (NFR-006).

## Principles
- **Least privilege** — the mobile client requests only the permissions its collectors need; the backend grants only required IAM.
- **Defence in depth** — TLS + authN/Z + input validation + audit logging, not a single control.
- **Isolation** — offensive PoC and monitored device run in a sandboxed lab network, separated from any real system.
- **Data minimisation** — collect and transmit the least signal data needed for triage (NFR-005).

## Controls
| Domain | Control | Traces to |
|---|---|---|
| Transport | TLS 1.2+ for all mobile↔backend and backend↔LLM traffic. | NFR-003 |
| Authentication | Backend authenticates clients; unauthenticated requests rejected. | NFR-004 |
| Authorisation | Least-privilege IAM for ECS/Fargate + scoped API access. | NFR-004 |
| Secrets | LLM/API keys via environment/secret manager, never in code or the repo. | NFR-003 |
| Privacy | On-device signal minimisation; no raw personal content beyond triage need. | NFR-005 |
| Input validation | Signals validated against typed schemas before triage. | NFR-009 |
| Audit | Every alert logged with inputs, mapping, timestamp. | FR-009 / NFR-011 |
| Supply chain | App built from my own source; dependencies pinned; PoC payload never shipped to a real build. | — |
| Lab isolation | Emulator/burner device + sandboxed network for all offensive runs. | NFR-012 |

## Secrets & repo hygiene
The public repo must never contain keys, tokens, real endpoints, capture files, or built APKs — these are excluded via `.gitignore`. Local tooling config (`.claude/`, `CLAUDE.md`) is also gitignored and never committed.
