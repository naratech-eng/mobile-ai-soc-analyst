# Mobile AI SOC Analyst

An AI-based security solution that detects threats, APTs, backdoors, malware, and spyware on Android/iOS. The system pairs an on-device mobile client with a backend AI agent acting as a **Tier-1 SOC analyst** — triaging signals, correlating them against MITRE ATT&CK Mobile techniques, and generating initial incident reports for a human analyst to action.

## Documentation map

- **Product & Requirements** — [PRD](product/prd.md), [MoSCoW](product/moscow.md), [functional](product/functional-requirements.md) and [non-functional](product/non-functional-requirements.md) requirements.
- **Engineering** — [tech stack](engineering/tech-stack.md), [architecture](engineering/architecture.md), [system design](engineering/system-design.md).
- **Security** — [security model](security/security-model.md) and [threat model](security/threat-model.md) (what is being tested).
- **Offense** — [Cyber Kill Chain & ATT&CK mapping](02-offense/kill-chain.md), self-built benign PoC.
- **Defense** — [incident response](03-defense/incident-response.md), [threat hunting](03-defense/threat-hunting.md), [malware analysis](03-defense/malware-analysis.md), [deception](03-defense/deception.md).
- **Testing** — [test strategy](testing/test-strategy.md) and detection matrix.
- **Lab** — [lab manual](04-lab/lab-manual.md) for the detection demo.
- **Research** — [research report](05-research/report.md).
- **Planning** — [action plan](planning/action-plan.md) and roadmap.

> All offensive material in these docs is **self-built, benign proof-of-concept** executed only in an isolated lab against infrastructure under my control. No in-the-wild malware is used.
