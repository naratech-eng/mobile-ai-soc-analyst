# Functional requirements

Each requirement has a stable ID, a MoSCoW priority (see [MoSCoW](moscow.md)), and a verifying test in the [Test Strategy](../testing/test-strategy.md) detection/functional matrix.

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| FR-001 | The mobile client shall collect on-device signals: granted permissions, installed apps, scheduled jobs, and network activity. | Must | TC-COLLECT |
| FR-002 | The backend agent shall triage collected signals and classify them as benign or suspicious with rationale. | Must | TC-TRIAGE |
| FR-003 | The agent shall correlate suspicious signals to specific ATT&CK Mobile techniques via the RAG knowledge base. | Must | TC-T1422 … TC-T1541 |
| FR-004 | The agent shall generate an incident-response report covering Preparation, Detection & Analysis, Containment/Eradication/Recovery, and Post-Event Activity. | Must | TC-IR-REPORT |
| FR-005 | The agent shall run an analyst-supplied threat-hunting query against historical signal logs and return matches. | Should | TC-HUNT |
| FR-006 | The mobile client shall render a SOC dashboard showing live alerts with technique mapping and timestamps. | Should | TC-DASH |
| FR-007 | The system shall raise a high-confidence alert when the deception/honeypot artifact is accessed. | Should | TC-DECOY |
| FR-008 | The agent shall summarise static/behavioural findings from a decompiled PoC APK. | Could | TC-MALWARE |
| FR-009 | The system shall record every alert with its source signals, technique mapping, and timestamp for later hunting/audit. | Must | TC-AUDIT |

Detection of the PoC kill chain (FR-003) spans the six techniques mapped in [Kill Chain & ATT&CK Mapping](../02-offense/kill-chain.md): [T1422](https://attack.mitre.org/techniques/T1422/), [T1474.003](https://attack.mitre.org/techniques/T1474/003/), [T1603](https://attack.mitre.org/techniques/T1603/), [T1521](https://attack.mitre.org/techniques/T1521/), [T1646](https://attack.mitre.org/techniques/T1646/), [T1541](https://attack.mitre.org/techniques/T1541/).
