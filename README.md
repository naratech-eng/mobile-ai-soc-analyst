# Mobile AI SOC Analyst

An Expo/React Native mobile SOC client backed by a FastAPI + Pydantic AI
detection agent: on-device signals are collected, posted to the backend,
triaged by an LLM agent grounded in a MITRE ATT&CK Mobile knowledge base
(RAG/ChromaDB), and surfaced as live alerts, an analyst-driven hunt search,
and an AI-generated incident-response report.

The agent is a **Tier-1 SOC analyst**: it triages, correlates against
ATT&CK techniques, and drafts IR reports. Actual containment, threat-hunt
hypotheses, and malware analysis stay human-driven — the agent's output
feeds the analyst's decisions, not the other way around. See
[docs/](docs/) (GitBook-published) for the full product/engineering/
security docs and the research report.

## Architecture

```
┌─────────────────────────────┐
│  Mobile client (Expo/RN)     │
│  Preflight → Dashboard/      │
│  Hunt/IR Report screens      │
│  src/collectors/  src/api/   │
└──────────────┬───────────────┘
               │ HTTPS + shared bearer token
               ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (FastAPI, backend/app/)                          │
│                                                             │
│  POST /signals ──▶ triage_agent (Pydantic AI + gpt-4o-mini)│
│                      │                                     │
│                      ▼                                     │
│                retrieve_attack_context tool                │
│                      │                                     │
│                      ▼                                     │
│              ChromaDB (RAG) ── seed_techniques.json         │
│                      │                                     │
│                      ▼                                     │
│         benign/suspicious + confidence + ATT&CK ID         │
│                      │                                     │
│                      ▼                                     │
│         persist Signal → Event → Alert (SQLite)             │
│                                                             │
│  GET  /alerts   ──▶ live alert feed                         │
│  POST /hunt     ──▶ keyword search over persisted signals   │
│  POST /reports/ir ─▶ report_agent (2nd Pydantic AI agent)   │
│                      writes a 4-stage IR narrative from the │
│                      real Alert→Event→Signal→Technique chain│
└─────────────────────────────────────────────────────────┘
```

Two agents, one framework (Pydantic AI):
- **`triage_agent`** ([backend/app/agents/agent.py](backend/app/agents/agent.py)) — classifies a signal, must cite a real ATT&CK ID returned by its RAG tool call or leave it null (never invents one).
- **`report_agent`** ([backend/app/agents/report_agent.py](backend/app/agents/report_agent.py)) — writes the IR report, grounded in the specific alert's data plus a description of the real containment scripts in `ir/`.

## Repo layout

| Path | What |
|---|---|
| `mobile/` | Expo/React Native client |
| `backend/` | FastAPI + Pydantic AI detection backend |
| `infra/` | Terraform (Azure Container Apps deployment) |
| `poc-apk/` | Self-built benign PoC Android app implementing the kill chain (recon → supply-chain delivery → scheduled job → C2 → exfil → persistence) — see [CLAUDE.md](CLAUDE.md) for the ATT&CK technique mapping and why no real malware is used |
| `poc-c2-server/` | Test C2 server the PoC APK talks to (TLS socket, lab-only) |
| `ir/` | Containment/eradication/recovery scripts (`adb`/`iptables`-based) used both for the live demo and referenced by the IR-report agent |
| `honeypot/`, `containment/`, `evidence/` | Scaffolded, not yet implemented |
| `docs/` | GitBook-published documentation (product, engineering, security, offense/defense, research report) |

## Run locally

You need two things running: the **backend** (FastAPI) and **Metro**
(Expo's dev server) — the mobile app is a dev-client build that fetches its
JS bundle from Metro at runtime, so nothing is baked into the `.apk` except
the native shell.

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or your preferred env tool
pip install -e ".[dev]"

cp .env.example .env
# edit .env:
#   OPENAI_API_KEY=sk-...           (your own key)
#   BACKEND_API_KEY=<any string>    (shared bearer token — mobile must match)
#   DATABASE_URL=sqlite:///./soc_analyst.db
#   CHROMA_PERSIST_DIR=./chroma_data

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` (not `127.0.0.1`) matters if your emulator/device is on a
different machine on the LAN — the app needs to reach your machine's LAN
IP, not just localhost. On startup the backend seeds the RAG store from
`app/rag/seed_techniques.json` automatically (a few ms — no network model
download; see "RAG" below).

Run the test suite:

```bash
pytest -v
```

### 2. Mobile app

```bash
cd mobile
npm install
cp .env.example .env
# edit .env:
#   EXPO_PUBLIC_BACKEND_URL=http://<your-LAN-IP>:8000
#   EXPO_PUBLIC_BACKEND_API_KEY=<same value as backend's BACKEND_API_KEY>
```

**First time on a device/emulator**, you need an installable dev-client
build — plain Expo Go won't work (this project tracks current Expo SDKs
faster than the published Expo Go app supports):

```bash
npx eas-cli login              # your own Expo account (free tier is fine)
npx eas-cli build --profile development --platform android
```

That queues a cloud build (no local Android SDK needed) and gives a
download link/QR for an installable `.apk`. Install it once:

```bash
adb install -r path/to/downloaded.apk
```

**Every session after that**, you only need Metro running — no rebuild
unless you add a native module:

```bash
npx expo start --dev-client --host lan
```

Open the installed app; if it doesn't auto-discover the dev server, use
its "Enter URL manually" screen and type `http://<your-LAN-IP>:8081`.

Run the test suite / type-check:

```bash
npx jest
npx tsc --noEmit
```

### Emulator target

Android via Genymotion (matches the lab environment used for the offensive
PoC in `poc-apk/`) — no Apple Developer account is set up, so iOS dev
builds aren't currently produced. See
[docs/engineering/tech-stack.md](docs/engineering/tech-stack.md).

## Azure deployment

`infra/` (Terraform, `azurerm` provider) provisions one Container Apps
Environment shared by two Container Apps — `ca-socanalyst-dev` (tracks the
`dev` branch) and `ca-socanalyst-prod` (tracks `main`) — plus a Key Vault
for the OpenAI key, a Log Analytics workspace, and per-environment Azure
Files shares mounted at `/mnt/data` for the SQLite store (Container Apps
have no persistent local disk otherwise; both apps are capped at
`max_replicas = 1` since SQLite over a shared mount doesn't handle
concurrent writers — see the note in
[backend/app/store/db.py](backend/app/store/db.py)).

ChromaDB's persist directory is **not** on that mount (`/app/chroma_data`,
local/ephemeral instead) — Azure Files' SMB locking broke ChromaDB's
internal SQLite use, so it's re-seeded from `seed_techniques.json` on every
cold start instead (cheap: 6 docs, no network model download since RAG uses
a lightweight dependency-free embedding, not ChromaDB's default ONNX model
— see [backend/app/rag/embedding.py](backend/app/rag/embedding.py)).

**CI/CD**: pushing to `dev`/`main` under `backend/**` triggers
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — runs
tests, builds + pushes the image to GHCR, then `az containerapp update`s
the matching app. Auth is OIDC (User-Assigned Managed Identity federated
with GitHub, no stored Azure secret) — see [infra/README.md](infra/README.md)
for the full bootstrap (only needed once, already done for this project).

Infra changes (`infra/**`) don't auto-apply — that's a manual
`workflow_dispatch` (`infra-apply.yml`) or `terraform apply` locally, so a
resource resize or new resource is always a deliberate action.

**Known issue (as of writing):** both Container Apps have hit an
intermittent Azure-side ingress wedge today (control-plane operations stuck
at "Accepted", never reaching "Succeeded" — confirmed via
`az monitor activity-log list`, not a code/config issue). It's self-healed
before; if you hit it, `az containerapp revision restart` or a fresh
image deploy sometimes clears it, but isn't guaranteed. **Local backend is
the reliable path** when this happens — see "Run locally" above.

## RAG knowledge base

`backend/app/rag/seed_techniques.json` is a static, hand-written seed —
6 entries, one per technique in the PoC kill chain (T1422, T1474.003,
T1603, T1521, T1646, T1541). There is **no document-upload path**; the
knowledge base is exactly this file, loaded into ChromaDB on every backend
startup via `ingest()`. It's scoped to reliably ground this project's PoC
demo, not a full MITRE ATT&CK Mobile + OWASP MASTG corpus.

To extend it: `python -m app.rag.ingest --source <path-to-json>` accepts
any file in the same `[{attack_id, name, url, text}, ...]` shape — no code
changes needed, just a bigger export.
