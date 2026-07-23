# Architecture

## Components

- **Mobile client** — Expo / React Native app. Collects on-device signals (permissions, installed apps, scheduled jobs, network activity) and displays the SOC dashboard and alerts.
- **Backend agent service** — FastAPI. Hosts the agent logic and exposes the analysis API.
- **RAG layer** — MITRE ATT&CK Mobile + OWASP MASTG knowledge base over ChromaDB.
- **Agent framework** — Pydantic AI (type-safe, low line count). CrewAI optional as a thin layer to demo multiple collaborating roles (Recon / Malware Analysis / Threat Hunting / Report-Writer).

## What the agent actually is

The agent is a **Tier-1 SOC analyst**: triage, correlation against ATT&CK techniques, and initial IR report generation. It is not the whole defense story.

| Requirement | Agent's role | Human (analyst) role |
|---|---|---|
| Detection & Analysis | Core agent function | Review, escalate |
| Incident Response | Report generation, suggested containment | Execute containment |
| Threat Hunting | Runs the hunt query | Forms the hypothesis |
| Malware Analysis | Summarizes findings | Manual decompile (jadx/apktool) |
| Deception (honeypot) | Alerts when decoy is touched | Plants the decoy |

This mirrors how AI is used in real SOCs: agent output feeds human decisions.
