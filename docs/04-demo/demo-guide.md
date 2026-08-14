# Demo Guide: PoC APK + Honeypot + SOC Detection

> **Purpose:** Step-by-step guide to demonstrate the full kill-chain — from PoC
> malware execution on an Android emulator to SOC detection, alerting, and
> honeypot decoy tripwire — for the CYT230 Project 2 presentation.

---

## Architecture Overview

```
┌─────────────────┐     ┌───────────────────────────────┐     ┌─────────────────┐
│  PoC Flashlight │     │  Expo SOC App                  │     │  FastAPI        │
│  (Offense)      │     │  (one app, three tabs)          │     │  Backend        │
│                 │     │                                 │     │                 │
│ com.utiltools   │────▶│ Dashboard tab: collects device  │────▶│ Triage + ATT&CK │
│ .torchlight     │     │ signals & posts to backend;     │◀────│ correlation,    │
│                 │     │ same tab renders live alerts;   │     │ raises alerts   │
│                 │     │ Hunt + IR Report are other tabs │     │                 │
└─────────────────┘     └───────────────────────────────┘     └────────┬────────┘
                                                                         ▲
                                                              ┌──────────┴──────┐
                                                              │  Honeypot Decoy │
                                                              │  (FR-007)       │
                                                              │ Manual touch on │
                                                              │ decoy file →    │
                                                              │ high-confidence │
                                                              │ alert           │
                                                              └─────────────────┘
```

> The PoC app never touches the honeypot decoy — `ExfilModule.kt` only ever
> sends its own hardcoded dummy file over the C2 socket. The decoy is a fully
> independent tripwire: `plant_decoy.sh` plants it, and it's triggered by a
> manual read (e.g. `adb shell cat ...`) that stands in for an attacker
> rummaging the filesystem. `instrument_access.py` posts straight to the
> backend's `/decoy/event` — it never talks to the mobile app — and the
> resulting alert only reaches the dashboard the same way any other alert
> does, via `GET /alerts`.

### Two Apps on One Emulator

| App | Package | Role |
|-----|---------|------|
| **PoC Flashlight** | `com.utiltools.torchlight` | Offense — executes ATT&CK Mobile kill-chain |
| **SOC Analyst** | `com.socanalyst.mobile` | Defense — EDR agent + analyst dashboard |

Both coexist on the same Genymotion emulator with different package names.

---

## PoC Flashlight App — Kill-Chain Techniques

The PoC app disguises itself as a benign flashlight utility. On launch, it
executes a full ATT&CK Mobile kill-chain:

| Step | Technique | Description |
|------|-----------|-------------|
| 1 | **T1474.003** — Supply Chain Compromise | App sideloaded disguised as a flashlight utility |
| 2 | **T1422** — Network Config Discovery | Reads WiFi SSID, BSSID, IP address, link speed |
| 3 | **T1603** — Scheduled Job | Registers a 15-min periodic WorkManager job for persistence |
| 4 | **T1541** — Foreground Persistence | Starts a foreground service with notification to resist killing |
| 5 | **T1521** — Encrypted Channel | Opens TLS socket to C2 server and beacons recon data |
| 6 | **T1646** — Exfiltration Over C2 | Reuses the TLS socket to send dummy "sensitive" file |

**Source:** `poc-apk/app/src/main/java/com/utiltools/torchlight/`

---

## SOC Analyst App — Detection & Response

The Expo React Native app serves two roles:

1. **EDR Agent** — Collects device signals (installed apps, network activity,
   scheduled jobs) and posts them to the backend for triage
2. **Analyst Dashboard** — Displays alerts, supports threat hunting, and
   generates incident response reports

**Key screens** (three tabs of the same app — not separate apps):
- **Dashboard** — "Collect & Post Signals" button, live alert feed
- **Hunt** — Keyword search over historical signals
- **IR Report** — AI-generated incident response report from alert context

**Source:** `mobile/src/`

---

## Backend — Detection Engine

FastAPI backend that receives signals, triages them using AI + ATT&CK Mobile
RAG correlation, and raises severity-scored alerts.

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/signals` | POST | Bearer token | Ingest device signals, triage, raise alerts |
| `/alerts` | GET | Bearer token | List all alerts for dashboard |
| `/hunt` | POST | Bearer token | Keyword search over historical signals |
| `/reports/ir` | POST | Bearer token | Generate IR report (body: `{"alert_id": "..."}`) |
| `/decoy/event` | POST | Bearer token | Honeypot decoy access → high-severity alert |
| `/demo` | GET | None | Browser demo page (presentation only) |
| `/demo/alerts` | GET | None | Raw JSON alerts (presentation only) |
| `/health` | GET | None | Health check |
| `/docs` | GET | None | Swagger UI API explorer |

**Source:** `backend/app/`

---

## Honeypot Decoy (FR-007)

A fake credential file planted on the device. No legitimate app should ever
access it — any access is treated as high-confidence malicious.

### Components

| Component | File | Purpose |
|-----------|------|---------|
| Plant script | `honeypot/plant_decoy.sh` | Plants `sys_backup_credentials.txt` on emulator |
| Instrumentation | `honeypot/instrument_access.py` | Monitors decoy access, POSTs to backend |
| Backend endpoint | `POST /decoy/event` | Raises deterministic high-severity alert (confidence 1.0) |

### Decoy Flow

```
plant_decoy.sh → decoy file on device
                        │
    Manual touch (adb shell cat ...) — stands in for an attacker
    rummaging the filesystem; the PoC app never touches this file
                        │
    instrument_access.py detects the stat change
                        │
    POST /decoy/event → backend
                        │
    High-severity alert (confidence: 1.0)
    "No legitimate app should touch this artifact"
```

---

## Step-by-Step Demo Instructions

### Prerequisites

- Genymotion emulator running on Windows (same network)
- Backend running on Mac: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0`
- PoC APK built: `poc-apk/app/build/outputs/apk/debug/app-debug.apk`
- Expo SOC app installed on emulator (via EAS build)

### Step 1 — Install the PoC APK

On your Windows machine with adb connected to Genymotion:

```bash
adb install app-debug.apk
```

The app appears as **"Flashlight"** in the app drawer.

### Step 2 — Launch the PoC App

Tap **Flashlight** in the emulator. The kill-chain runs immediately:

- Network recon collects WiFi/IP info (T1422)
- WorkManager job registered for periodic recon (T1603)
- Foreground service starts with notification (T1541)
- C2 beacon attempts TLS connection (T1521)

> The flashlight toggle won't work on Genymotion (no flash hardware) — this is
> expected and doesn't affect the kill-chain.

### Step 3 — Post Signals from SOC App

Open the **SOC Analyst** app on the same emulator:

1. Go to the **Dashboard** tab
2. Tap **Collect & Post Signals** — the app collects real device signals
   (installed apps, network activity, scheduled jobs) and posts them to the
   backend
3. The backend triages each signal, correlates with ATT&CK techniques, and
   raises alerts

### Step 4 — View Alerts

**Option A — Browser demo page (recommended for video):**

```
http://localhost:8000/demo
```

Shows a visual dashboard with architecture diagram, alert stats, and live
alert table. Click **Refresh** to see new alerts.

**Option B — Raw JSON:**

```bash
curl -H "Authorization: Bearer <API_KEY>" http://localhost:8000/alerts | python3 -m json.tool
```

**Option C — Swagger UI:**

```
http://localhost:8000/docs
```

Click Authorize → enter `Bearer <API_KEY>` → try any endpoint.

### Step 5 — Trigger the Honeypot (Optional)

On your Mac, with `adb` pointed at the Genymotion emulator (`adb connect
<GENYMOTION_IP>:5555` first if it isn't already connected):

```bash
cd honeypot
./plant_decoy.sh                # plants sys_backup_credentials.txt via adb

BACKEND_URL=http://localhost:8000 \
BACKEND_API_KEY=<API_KEY> \
python3 instrument_access.py    # start watching in a separate terminal
```

Then, in a third terminal, simulate the attacker touching it — this is a
manual step; nothing in the PoC app reads this file on its own:

```bash
adb shell cat /sdcard/Documents/sys_backup_credentials.txt
```

`instrument_access.py` detects the access and posts straight to the backend's
`/decoy/event`, which raises a **high-severity** alert with confidence 1.0.
Refresh the demo page to see it appear.

### Step 6 — Generate IR Report (Optional)

From the SOC app's **IR Report** tab, or Swagger UI:

```
POST /reports/ir
{"alert_id": "<alert_id from /alerts>"}
```

The backend generates an AI-powered incident response report with kill-chain
analysis, recommended actions, and ATT&CK mapping.

---

## Demo Script for Video (≈4 minutes)

1. **(0:00)** Show the emulator — two apps installed: Flashlight + SOC Analyst
2. **(0:15)** Launch Flashlight app — explain the kill-chain running behind the scenes
3. **(1:00)** Switch to SOC Analyst app's Dashboard tab — tap Collect & Post Signals
4. **(1:15)** Open browser → `http://localhost:8000/demo` — show alerts appearing
5. **(2:00)** Explain the alert table: T1422, T1474.003, T1603 techniques detected
6. **(2:30)** Trigger honeypot manually (`adb shell cat` the decoy) — show the
   independent high-severity alert appear on refresh; call out on camera that
   this path is separate from the PoC app's own kill-chain
7. **(3:00)** Generate IR report for the high-severity alert
8. **(3:30)** Summary — offense, detection, deception, response — full cycle

---

## API Key

```
Authorization: Bearer fa01135f410e56b92c4d2a65f6dcc8b1984d1e3dd49cd8c5dfd5419a67829c7b
```

> Lab/demo only — never use this key in production.
