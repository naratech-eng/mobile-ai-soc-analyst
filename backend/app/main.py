import threading
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.responses import HTMLResponse
from sqlmodel import Session

from app.api import alerts, decoy, hunt, reports, signals
from app.models import Alert
from app.rag.ingest import ingest
from app.store.db import get_session, init_db
from app.store.repository import list_alerts


def _seed_rag() -> None:
    # CHROMA_PERSIST_DIR is local/ephemeral storage (not the Azure Files
    # mount — SQLite locking over SMB breaks ChromaDB's internal store), so
    # re-seed the ATT&CK technique docs on every cold start (uses the
    # lightweight HashingEmbeddingFunction, not ChromaDB's default ONNX
    # model, so it stays well within the container's 0.5 vCPU / 1Gi).
    try:
        count = ingest()
        print(f"RAG: ingested {count} technique docs on startup", flush=True)
    except Exception as exc:  # never let a RAG stall take the whole app down
        print(f"WARN RAG: startup ingest failed ({exc!r}); "
              "correlation will fall back to no-match until it recovers.", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed off the request path in a daemon thread: ChromaDB init has been
    # observed to stall on the container, and blocking here would hang the
    # entire app (FastAPI serves nothing until lifespan startup returns).
    threading.Thread(target=_seed_rag, name="rag-seed", daemon=True).start()
    yield


app = FastAPI(
    title="Mobile AI SOC Analyst — Detection Backend",
    description="Tier-1 SOC analyst agent: triage + ATT&CK Mobile correlation.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(signals.router)
app.include_router(alerts.router)
app.include_router(hunt.router)
app.include_router(reports.router)
app.include_router(decoy.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/demo/alerts")
def demo_alerts(session: Session = Depends(get_session)) -> list[Alert]:
    """No-auth read-only endpoint for live demo / browser viewing only.
    Remove before any real deployment."""
    return list_alerts(session)


@app.get("/demo", response_class=HTMLResponse)
def demo_page(session: Session = Depends(get_session)) -> str:
    """Single-page demo overview showing both apps, architecture, and live alerts.
    For presentation/video use only — no auth required."""
    alerts_list = list_alerts(session)
    total = len(alerts_list)
    high_count = sum(1 for a in alerts_list if a.severity == "high")
    medium_count = sum(1 for a in alerts_list if a.severity == "medium")

    rows = ""
    for a in alerts_list:
        sev_color = "#ef4444" if a.severity == "high" else "#f59e0b"
        attack = a.attack_id or "HONEYPOT"
        rows += f"""
        <tr>
          <td><span class="sev" style="background:{sev_color}">{a.severity.upper()}</span></td>
          <td><span class="tech">{attack}</span></td>
          <td>{a.raised_at.strftime('%Y-%m-%d %H:%M:%S')}</td>
          <td style="font-family:monospace;font-size:12px;color:#6b7280">{a.alert_id}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mobile AI SOC Analyst — Demo</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; }}
  .container {{ max-width: 900px; margin: 0 auto; }}
  h1 {{ font-size: 28px; margin-bottom: 8px; }}
  .subtitle {{ color: #94a3b8; margin-bottom: 32px; }}
  .cards {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }}
  .card {{ background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }}
  .card h2 {{ font-size: 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }}
  .card .role {{ font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 12px; }}
  .role.offense {{ background: #7f1d1d; color: #fca5a5; }}
  .role.defense {{ background: #1e3a5f; color: #93c5fd; }}
  .card p {{ font-size: 14px; color: #94a3b8; line-height: 1.6; }}
  .card ul {{ list-style: none; margin-top: 12px; }}
  .card li {{ font-size: 13px; padding: 4px 0; color: #cbd5e1; }}
  .card li:before {{ content: "› "; color: #64748b; }}
  .stats {{ display: flex; gap: 16px; margin-bottom: 24px; }}
  .stat {{ background: #1e293b; padding: 16px 24px; border-radius: 10px; text-align: center; border: 1px solid #334155; }}
  .stat .num {{ font-size: 32px; font-weight: 700; }}
  .stat .label {{ font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }}
  .stat.high .num {{ color: #ef4444; }}
  .stat.med .num {{ color: #f59e0b; }}
  .stat.total .num {{ color: #38bdf8; }}
  table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; }}
  th {{ text-align: left; padding: 12px 16px; background: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }}
  td {{ padding: 10px 16px; border-top: 1px solid #334155; font-size: 14px; }}
  .sev {{ padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: white; }}
  .tech {{ font-family: monospace; font-weight: 600; color: #93c5fd; }}
  .arch {{ background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #334155; }}
  .arch h2 {{ font-size: 18px; margin-bottom: 16px; }}
  .flow {{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }}
  .flow-box {{ padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; }}
  .flow-box.attack {{ background: #7f1d1d; color: #fca5a5; }}
  .flow-box.edr {{ background: #1e3a5f; color: #93c5fd; }}
  .flow-box.backend {{ background: #14532d; color: #86efac; }}
  .flow-box.ui {{ background: #3b0764; color: #c4b5fd; }}
  .arrow {{ color: #475569; font-size: 20px; }}
  .footer {{ margin-top: 32px; text-align: center; color: #475569; font-size: 12px; }}
  a {{ color: #38bdf8; text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}
  .refresh {{ position: fixed; top: 20px; right: 20px; background: #334155; color: #e2e8f0; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }}
  .refresh:hover {{ background: #475569; }}
</style>
</head>
<body>
<button class="refresh" onclick="location.reload()">↻ Refresh</button>
<div class="container">
  <h1>📱 Mobile AI SOC Analyst</h1>
  <p class="subtitle">PoC Demo — ATT&CK Mobile Kill-Chain Detection &amp; Honeypot Deception</p>

  <div class="arch">
    <h2>Architecture Flow</h2>
    <div class="flow">
      <div class="flow-box attack">🔥 PoC Flashlight App<br><small>com.utiltools.torchlight</small></div>
      <span class="arrow">→</span>
      <div class="flow-box edr">🛡️ Expo SOC App<br><small>Dashboard tab: collects &amp; posts signals</small></div>
      <span class="arrow">→</span>
      <div class="flow-box backend">⚙️ FastAPI Backend<br><small>Triage + Correlation</small></div>
      <span class="arrow">→</span>
      <div class="flow-box ui">📊 Same App<br><small>Dashboard tab renders the alerts</small></div>
    </div>
    <p style="margin-top:12px;font-size:13px;color:#64748b">
      One Expo app, three tabs (Dashboard / Hunt / IR Report) — not a separate
      dashboard app. The honeypot decoy is a fully independent path: it never
      goes through the PoC app, and posts straight to <code>/decoy/event</code>
      on this backend.
    </p>
  </div>

  <div class="cards">
    <div class="card">
      <span class="role offense">Offense</span>
      <h2>🔥 PoC Flashlight App</h2>
      <p>A benign-looking flashlight utility that executes a full ATT&CK Mobile kill-chain:</p>
      <ul>
        <li><b>T1474.003</b> — Supply Chain Compromise (sideloaded disguised app)</li>
        <li><b>T1422</b> — Network Recon (WiFi SSID, IP, link speed)</li>
        <li><b>T1603</b> — Scheduled Job (WorkManager periodic recon)</li>
        <li><b>T1541</b> — Foreground Persistence (resists backgrounding)</li>
        <li><b>T1521</b> — C2 Beacon (TLS socket to lab server)</li>
        <li><b>T1646</b> — Exfiltration over C2 Channel</li>
      </ul>
    </div>
    <div class="card">
      <span class="role defense">Defense</span>
      <h2>🛡️ SOC Analyst App + Backend</h2>
      <p>Expo React Native app acts as EDR agent, collecting device signals and posting to the backend for triage:</p>
      <ul>
        <li>Collects installed apps, network activity, scheduled jobs</li>
        <li>Posts signals to backend for AI-powered triage</li>
        <li>Backend correlates with ATT&CK Mobile techniques</li>
        <li>Raises severity-scored alerts with kill-chain mapping</li>
        <li><b>FR-007 Honeypot:</b> Decoy file triggers high-confidence alert</li>
        <li>Analyst dashboard + hunt + IR report generation</li>
      </ul>
    </div>
  </div>

  <div class="stats">
    <div class="stat total"><div class="num">{total}</div><div class="label">Total Alerts</div></div>
    <div class="stat high"><div class="num">{high_count}</div><div class="label">High Severity</div></div>
    <div class="stat med"><div class="num">{medium_count}</div><div class="label">Medium Severity</div></div>
  </div>

  <h2 style="margin-bottom:16px">Live Alerts</h2>
  <table>
    <thead>
      <tr><th>Severity</th><th>ATT&CK Technique</th><th>Time (UTC)</th><th>Alert ID</th></tr>
    </thead>
    <tbody>
      {rows if rows else '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px">No alerts yet — launch the PoC app and post signals from the SOC app</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p>Mobile AI SOC Analyst — CYT230 Project 2 | <a href="/demo/alerts" target="_blank">View Raw JSON</a> | <a href="/docs" target="_blank">API Docs</a></p>
  </div>
</div>
</body>
</html>"""
