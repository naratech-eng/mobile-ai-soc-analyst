# Test strategy

How the system is tested, and the detection matrix proving each PoC technique is caught. Requirements are in [Functional](../product/functional-requirements.md) / [Non-functional](../product/non-functional-requirements.md); the attack chain is in [Threat Model](../security/threat-model.md).

> Safety framing: all attack execution is a **self-built benign proof-of-concept** in an **isolated lab** against infrastructure **under my control** — **never** a personal device.

## Test levels
| Level | Scope | Examples |
|---|---|---|
| Unit | Agent tools + schemas | Triage tool returns typed verdict; signal schema validation (NFR-009) |
| Integration | API + RAG retrieval | `/signals` → alert; RAG returns correct technique docs (NFR-002) |
| Detection efficacy | End-to-end per technique | Each ATT&CK step produces the expected alert (true positive) |
| False-positive baseline | Clean device | Baseline run raises **zero** alerts |
| Security | Transport + auth | TLS enforced (NFR-003); unauthenticated calls rejected (NFR-004) |
| End-to-end (demo) | Full kill chain | The recorded [Lab Manual](../04-lab/lab-manual.md) run |

## How to test — guidelines
1. **Environment:** isolated Android emulator or wiped burner device; sandboxed network; test C2 server under my control.
2. **Test data:** the self-built benign PoC only. No in-the-wild samples.
3. **Baseline first:** capture the clean-device state and confirm no alerts before running any attack step.
4. **Run one step at a time:** execute each kill-chain phase, then confirm the matching alert and capture evidence.
5. **Evidence to capture:** `logcat`, `adb shell dumpsys jobscheduler`, Wireshark capture of the TLS session, and exfil timestamps — cross-referenced to the alert's timestamp.
6. **Record pass/fail** in the matrix below; a step passes only if the expected alert fires with the correct technique mapping.

## Detection test matrix
| Test ID | Trigger action | ATT&CK | Expected alert | Requirement | Result |
|---|---|---|---|---|---|
| TC-COLLECT | Client collects signals | — | Signals ingested, no errors | FR-001 | TBD |
| TC-TRIAGE | Feed mixed signals | — | Suspicious flagged w/ rationale | FR-002 | TBD |
| TC-T1422 | App reads network config | [T1422](https://attack.mitre.org/techniques/T1422/) | Recon alert | FR-003 | TBD |
| TC-T1474 | Sideload utility w/ payload | [T1474.003](https://attack.mitre.org/techniques/T1474/003/) | Delivery/supply-chain alert | FR-003 | TBD |
| TC-T1603 | Schedule job | [T1603](https://attack.mitre.org/techniques/T1603/) | Scheduled-job alert | FR-003 | TBD |
| TC-T1521 | Open TLS C2 | [T1521](https://attack.mitre.org/techniques/T1521/) | Encrypted-channel alert | FR-003 | TBD |
| TC-T1646 | Exfil dummy file | [T1646](https://attack.mitre.org/techniques/T1646/) | Exfil-over-C2 alert | FR-003 | TBD |
| TC-T1541 | Abuse foreground service | [T1541](https://attack.mitre.org/techniques/T1541/) | Persistence alert | FR-003 | TBD |
| TC-IR-REPORT | Trigger incident | — | IR report, all stages populated | FR-004 | TBD |
| TC-HUNT | Run hunt query | — | Historical matches returned | FR-005 | TBD |
| TC-DASH | Open dashboard | — | Live alerts + mapping shown | FR-006 | TBD |
| TC-DECOY | Access honeypot | — | High-confidence tripwire alert | FR-007 | TBD |
| TC-MALWARE | Decompile PoC APK | — | Findings summarised | FR-008 | TBD |
| TC-AUDIT | Inspect store | — | Alert logged w/ inputs+timestamp | FR-009 | TBD |
| TC-BASELINE | Clean device run | — | Zero alerts | NFR-005 | TBD |
| TC-TLS | Inspect capture | — | No plaintext; auth required | NFR-003/004 | TBD |
