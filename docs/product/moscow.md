# MoSCoW prioritisation

Requirements broken down by capability area and prioritised for the gated timeline (Part 3 → Part 2 → Part 1). Each item traces to a requirement ID in [Functional Requirements](functional-requirements.md) / [Non-functional Requirements](non-functional-requirements.md) and is justified. See the [PRD](prd.md) for context and the [Action Plan](../planning/action-plan.md) for sequencing.

**Priority legend:** **M** = Must (project fails without it) · **S** = Should (important, not vital) · **C** = Could (nice-to-have) · **W** = Won't (explicitly deferred).

## Signal collection (device)
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| MC-01 | Collect granted permissions | M | FR-001 | Core input to triage |
| MC-02 | Collect installed apps | M | FR-001 | Needed to spot the malicious utility |
| MC-03 | Collect scheduled jobs (WorkManager/AlarmManager) | M | FR-001 | Detects the T1603 step |
| MC-04 | Collect network activity | M | FR-001 | Detects C2/exfil (T1521/T1646) |
| MC-05 | Buffer + retry on connectivity loss | S | NFR-006 | Avoids signal loss, improves reliability |

## Detection & correlation (agent)
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| DC-01 | Triage signals as benign/suspicious with rationale | M | FR-002 | The core agent function |
| DC-02 | Correlate to ATT&CK Mobile techniques via RAG | M | FR-003 | Grounds mappings in real technique docs |
| DC-03 | Cite a real ATT&CK ID in every mapping | M | FR-003 | Explainability / academic rigour |
| DC-04 | Cover all 6 PoC techniques (T1422→T1541) | M | FR-003 | Required detection coverage |
| DC-05 | Confidence score per classification | S | FR-002 | Helps analyst prioritise |
| DC-06 | Multi-agent (CrewAI) role demo | C | — | Visual demo only; not core |

## Incident response
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| IR-01 | Generate IR report across all lifecycle stages | M | FR-004 | Part 2 defense requirement |
| IR-02 | Suggest containment actions | S | FR-004 | Assists analyst; human still executes |
| IR-03 | Containment scripts (kill job, revoke network) | S | — | Demonstrates containment on camera |

## Threat hunting
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| TH-01 | Run analyst hypothesis query over historical logs | S | FR-005 | Part 2 defense; proactive detection |
| TH-02 | Feed hunt outcomes back as new detections | C | FR-005 | Closes the loop; stretch goal |

## Deception
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| DE-01 | Plant a decoy/honeypot artifact | S | FR-007 | Part 2 defense requirement |
| DE-02 | High-confidence tripwire alert on access | S | FR-007 | The detection value of the decoy |

## Malware analysis
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| MA-01 | Decompile self-built PoC APK (jadx/apktool) | S | FR-008 | Part 2 defense; done manually |
| MA-02 | Agent summarises static/behavioural findings | C | FR-008 | Speeds up analysis narration |

## Dashboard & UX
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| UX-01 | SOC dashboard with live alerts + mapping + timestamps | S | FR-006 | Central to the demo split-screen |
| UX-02 | Plain-language alert rationale | M | NFR-007 | Non-expert must understand alerts |
| UX-03 | Alert filtering / timeline view | C | — | Polish, not required |

## Platform
| ID | Requirement | Priority | Priority rationale |
|---|---|---|---|
| PL-01 | Android support | M | Primary target platform |
| PL-02 | Architecture keeps iOS reachable | S | Avoid Android-only lock-in (NFR-008) |
| PL-03 | iOS feature parity | W | Out of scope this iteration |

## Security & platform quality
| ID | Requirement | Priority | Traces to | Rationale |
|---|---|---|---|---|
| SE-01 | TLS 1.2+ on all traffic | M | NFR-003 | Confidentiality/integrity in transit |
| SE-02 | Authenticated, authorised backend | M | NFR-004 | Prevent spoofed clients |
| SE-03 | Secrets via secret manager, never in repo | M | NFR-003 | Prevent credential leakage |
| SE-04 | On-device data minimisation | M | NFR-005 | Privacy; least data off-device |
| SE-05 | Full audit trail of alerts | M | FR-009/NFR-011 | Enables hunting + non-repudiation |
| SE-06 | Lab isolation for all offensive runs | M | NFR-012 | Safety; never a personal device |

## Deliverables (grading)
| ID | Requirement | Priority | Rationale |
|---|---|---|---|
| DL-01 | Reproducible lab manual | M | Part 3, 1/3 of grade |
| DL-02 | Research report (10–15 pp) with references | M | Part 3, 2/3 of grade |
| DL-03 | Video walkthrough (OBS) | M | Part 3 deliverable |
| DL-04 | ATT&CK Navigator layer of selected techniques | S | Strengthens report visuals |

## Won't have (this iteration)
| ID | Item | Why deferred |
|---|---|---|
| WN-01 | In-the-wild malware samples | Containment risk; not required by rubric |
| WN-02 | Autonomous containment/remediation | Human executes containment by design |
| WN-03 | Production hardening / multi-tenancy | Out of course scope |
| WN-04 | App-store distribution | Not a project goal |
