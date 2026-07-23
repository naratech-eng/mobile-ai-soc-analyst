# MoSCoW prioritisation

Prioritisation for the project timeline, driven by the gated grading (Part 3 → Part 2 → Part 1). See the [PRD](prd.md) for context and the [Action Plan](../planning/action-plan.md) for sequencing.

## Must have
- On-device signal collection: permissions, installed apps, scheduled jobs, network activity (**FR-001**).
- Backend agent triage + ATT&CK correlation with rationale (**FR-002**, **FR-003**).
- IR report generation covering all lifecycle stages (**FR-004**).
- Reproducible lab demo of the full kill chain with detection (Part 3/2 core).
- TLS for all mobile↔backend traffic (**NFR-003**, see [Security Model](../security/security-model.md)).

## Should have
- SOC dashboard with live alerts (**FR-006**).
- Threat-hunting query over historical logs (**FR-005**).
- Deception/honeypot tripwire alerting (**FR-007**).
- Baseline false-positive test pass (see [Test Strategy](../testing/test-strategy.md)).

## Could have
- CrewAI multi-agent demo (Recon / Malware / Hunting / Report-Writer roles).
- iOS feature parity (Android is first-class first).
- Dashboard polish (filtering, timeline view).

## Won't have (this iteration)
- In-the-wild malware samples (self-built benign PoC only).
- Autonomous containment/remediation (human executes containment).
- Production hardening, multi-tenancy, or app-store release.
