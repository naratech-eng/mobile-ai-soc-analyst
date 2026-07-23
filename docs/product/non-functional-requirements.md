# Non-functional requirements

Measurable quality attributes. Security-related NFRs trace to the [Security Model](../security/security-model.md); all are exercised in the [Test Strategy](../testing/test-strategy.md).

| ID | Category | Requirement | Target / measure |
|---|---|---|---|
| NFR-001 | Performance | Triage latency from signal receipt to alert. | < 60 s (p95) |
| NFR-002 | Performance | RAG retrieval latency for technique correlation. | < 2 s (p95) |
| NFR-003 | Security | All mobile↔backend traffic uses TLS 1.2+. | No plaintext observed in capture |
| NFR-004 | Security | Backend requires authenticated, authorised clients. | Unauthenticated calls rejected |
| NFR-005 | Privacy | On-device signals are minimised; no raw personal content leaves the device beyond what triage needs. | Data-flow review passes |
| NFR-006 | Reliability | Signal ingestion tolerates transient connectivity loss without data loss. | Buffered + retried |
| NFR-007 | Usability | An analyst can understand an alert (technique + rationale) without reading code. | Alert includes plain-language rationale |
| NFR-008 | Portability | Android is first-class; architecture keeps iOS reachable. | No Android-only assumptions in shared layer |
| NFR-009 | Maintainability | Agent tools and schemas are typed and unit-testable. | Pydantic AI typed tools; unit tests present |
| NFR-010 | Cost | Backend fits a low-cost footprint suitable for coursework. | Runs on minimal ECS Fargate sizing |
| NFR-011 | Observability | Every alert is logged with inputs, mapping, and timestamp. | Satisfies FR-009 audit trail |
| NFR-012 | Safety | All offensive execution is isolated from production/personal devices. | Emulator/burner + sandboxed network only |
