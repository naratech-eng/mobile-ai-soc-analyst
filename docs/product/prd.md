# Product Requirements Document

## Vision
An AI-assisted mobile security tool that acts as a **Tier-1 SOC analyst** for Android/iOS: it continuously collects on-device signals, correlates them against MITRE ATT&CK Mobile techniques, and produces triage and incident-response reporting that a human analyst actions.

## Problem statement
Mobile devices are high-value targets for APTs, backdoors, spyware, and commodity malware, yet individual users and small teams lack a SOC. Manual triage of on-device signals (permissions, installed apps, scheduled jobs, network activity) does not scale and requires expertise most users do not have. An AI agent can perform first-line triage and ATT&CK correlation, escalating only what matters.

## Goals
- Detect and explain the behaviours of a defined ATT&CK Mobile kill-chain on-device.
- Correlate raw signals to named ATT&CK techniques with human-readable rationale.
- Generate an initial incident-response report the analyst can act on.
- Provide a proactive threat-hunting query path and a deception (honeypot) tripwire.

## Non-goals
- Autonomous containment/remediation (human executes containment).
- Using in-the-wild malware (only self-built benign PoC).
- App-store distribution or production-grade hardening within this project.

## Primary persona
**Mobile SOC analyst** — reviews agent-raised alerts, forms threat-hunting hypotheses, executes containment, and owns the final incident decision. The agent augments, it does not replace, this person.

## Success metrics
| Metric | Target |
|---|---|
| Detection coverage of the 6 PoC techniques | 6/6 produce the expected alert |
| Triage latency (signal → alert) | < 60 s (see NFR-001) |
| False-positive rate on clean-device baseline | 0 alerts in the baseline run |
| IR report completeness | All IR lifecycle stages populated |

## Scope
**In:** on-device signal collection, backend agent triage, ATT&CK correlation via RAG, alerting + dashboard, IR report generation, threat-hunting query, honeypot alerting, the lab demo.
**Out:** autonomous containment, iOS feature parity (Android first), multi-tenant/production concerns.

## Assumptions & dependencies
- Testing occurs only in an isolated emulator / wiped burner device against infrastructure under my control.
- Backend and LLM access (Anthropic Claude) are available; see [Tech Stack](../engineering/tech-stack.md).
- Part 1 app specifics are confirmed with the professor (tracked in the [Action Plan](../planning/action-plan.md)).

## Release criteria (mapped to gated grading)
- **Part 3 (research + lab):** research report + reproducible [Lab Manual](../04-lab/lab-manual.md) + recording.
- **Part 2 (attack & defense):** full [kill chain](../02-offense/kill-chain.md) with ≥1 ATT&CK Mobile technique per step, plus IR, threat hunting, malware analysis, deception.
- **Part 1 (app):** the mobile security app itself, per prof-confirmed specifics.

Requirements are enumerated in [Functional Requirements](functional-requirements.md) and [Non-functional Requirements](non-functional-requirements.md); priorities in [MoSCoW](moscow.md).
