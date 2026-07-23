# Product Requirements Document

## 1. Overview
| Field | Value |
|---|---|
| Product | Mobile AI SOC Analyst |
| Platform | Android (first-class), iOS (reachable) |
| Type | On-device mobile client + backend AI agent service |
| Course context | CYT230 Project 2 (individual, three gated parts) |
| Status | In development |
| Deadline | TBD (see [Action Plan](../planning/action-plan.md)) |

## 2. Vision
An AI-assisted mobile security tool that acts as a **Tier-1 SOC analyst** for mobile devices: it continuously collects on-device signals, correlates them against MITRE ATT&CK Mobile techniques using a retrieval-grounded LLM agent, and produces triage and incident-response reporting that a human analyst reviews and actions. The product demonstrates how AI is realistically used in a SOC — augmenting analysts, not replacing them.

## 3. Background & context
Mobile devices are high-value targets for APTs, backdoors, spyware, and commodity malware, and detected mobile attacks continue to rise year over year. Individuals and small teams have no SOC and lack the expertise to triage on-device signals (permissions, installed apps, scheduled jobs, network activity) manually. Existing consumer AV is largely signature-based and opaque. An LLM agent grounded in ATT&CK and OWASP mobile knowledge can perform explainable first-line triage and escalate only what matters. See supporting literature in [References](../05-research/references.md).

## 4. Problem statement
> Mobile users cannot tell benign behaviour from an active attack chain on their own device, and have no explainable, ATT&CK-aligned triage to guide a response. Manual analysis does not scale and requires SOC-analyst expertise most users lack.

## 5. Objectives & key results
| Objective | Key result (measurable) |
|---|---|
| O1 — Detect the defined kill chain | 6/6 PoC ATT&CK techniques produce the expected alert |
| O2 — Explainable triage | Every alert includes a plain-language rationale + cited ATT&CK ID |
| O3 — Fast first-line triage | Signal→alert latency < 60 s p95 (NFR-001) |
| O4 — Low noise | 0 alerts on the clean-device baseline run |
| O5 — Actionable IR | IR report populated across all lifecycle stages (FR-004) |
| O6 — Proactive defense | Working threat-hunting query + honeypot tripwire (FR-005, FR-007) |

## 6. Personas
| Persona | Description | Needs from product |
|---|---|---|
| **Primary — Mobile SOC analyst (me)** | Reviews alerts, forms hunt hypotheses, executes containment, owns the incident decision. | Explainable alerts, ATT&CK mapping, IR report draft, hunt query. |
| **Secondary — Device owner / end user** | Runs the client on their device; non-expert. | Clear status, understandable alerts, privacy assurance. |
| **Evaluator — Course assessor** | Grades the report, lab, and demo. | Reproducible lab, framework mapping, academic rigour. |

## 7. Use cases / user stories
- **UC1 — Passive monitoring:** As a device owner, my client collects signals in the background so threats can be detected without my intervention. *(FR-001)*
- **UC2 — Triage & correlation:** As an analyst, I receive an alert that names the ATT&CK technique and explains why, so I can judge severity quickly. *(FR-002, FR-003)*
- **UC3 — Incident response:** As an analyst, I generate an IR report covering all lifecycle stages so I can respond and document consistently. *(FR-004)*
- **UC4 — Threat hunting:** As an analyst, I run my own hypothesis-driven query over historical logs to find activity before an alert fires. *(FR-005)*
- **UC5 — Deception:** As an analyst, I get a high-confidence alert the moment a decoy artifact is touched. *(FR-007)*
- **UC6 — Malware triage:** As an analyst, I get a summary of a decompiled PoC APK's capabilities. *(FR-008)*
- **UC7 — Dashboard review:** As an analyst, I see live alerts with technique mapping and timestamps. *(FR-006)*

## 8. Scope
**In scope:** on-device signal collection; backend agent triage; ATT&CK correlation via RAG; alerting + dashboard; IR report generation; threat-hunting query; honeypot alerting; malware-analysis summary; the reproducible lab demo.

**Out of scope (this iteration):** autonomous containment/remediation; iOS feature parity; multi-tenant/production hardening; app-store distribution; use of in-the-wild malware.

## 9. Functional overview
Detailed and enumerated in [Functional Requirements](functional-requirements.md) (FR-001…FR-009) and prioritised in [MoSCoW](moscow.md). Quality attributes are in [Non-functional Requirements](non-functional-requirements.md) (NFR-001…NFR-012). Architecture and runtime flows: [Architecture](../engineering/architecture.md), [System Design](../engineering/system-design.md).

## 10. Assumptions
- All offensive execution runs only in an isolated emulator / wiped burner device against infrastructure under my control — never a personal device.
- Backend and LLM access (Anthropic Claude) are available; see [Tech Stack](../engineering/tech-stack.md).
- The ATT&CK Mobile + OWASP MASTG knowledge base is available for RAG ingestion.

## 11. Dependencies
- MITRE ATT&CK Mobile matrix and OWASP MASVS/MASTG content.
- AWS account + Terraform for backend deployment.
- Android SDK/emulator, jadx/apktool, Wireshark, OBS for the lab and demo.
- Part 1 app specifics confirmed with the professor (blocks final app scope).

## 12. Constraints
- Individual project on a fixed academic timeline with gated parts.
- Must fit a low-cost footprint (NFR-010).
- Benign PoC only; no real malware (rubric-compliant and safe).

## 13. Risks & mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Deadline pressure across three gated parts | Incomplete deliverable | Prioritise *Must* items; Part 3→2→1 order (see [Action Plan](../planning/action-plan.md)) |
| LLM misclassification / false negatives | Missed detection | RAG grounding + detection test matrix (all 6 techniques) |
| Alert noise on real device behaviour | Analyst distrust | Clean-device baseline test; tune before demo |
| PoC escaping isolation | Safety incident | Emulator/burner + sandboxed network only (NFR-012) |
| App specifics unconfirmed | Rework of Part 1 | Confirm with prof early (M1) |

## 14. Success metrics
| Metric | Target |
|---|---|
| Detection coverage of the 6 PoC techniques | 6/6 expected alerts |
| Triage latency (signal → alert) | < 60 s p95 (NFR-001) |
| False-positive rate on clean baseline | 0 alerts |
| IR report completeness | All lifecycle stages populated |
| Rationale quality | Every alert cites a real ATT&CK ID |

## 15. Release criteria (mapped to gated grading)
- **Part 3 (research + lab):** research report (10–15 pp) + reproducible [Lab Manual](../04-lab/lab-manual.md) + video recording.
- **Part 2 (attack & defense):** full [kill chain](../02-offense/kill-chain.md) (≥1 ATT&CK Mobile technique per step) + IR, threat hunting, malware analysis, deception.
- **Part 1 (app):** the mobile security app, per prof-confirmed specifics.

## 16. Open questions
- Final Part 1 app specifics (pending prof meeting).
- Submission deadline date(s) for the roadmap Gantt.
- iOS scope for a future iteration.
