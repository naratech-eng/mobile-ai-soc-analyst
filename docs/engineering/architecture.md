# Architecture

C4-style view of the system: context, containers, and the agent's internal components. Technology choices are in [Tech Stack](tech-stack.md); runtime flows in [System Design](system-design.md).

## What the agent is
The agent is a **Tier-1 SOC analyst**: triage, correlation against ATT&CK techniques, and initial IR report generation. It augments a human analyst — it is not the whole defense.

| Requirement | Agent's role | Human (analyst) role |
|---|---|---|
| Detection & Analysis | Core agent function | Review, escalate |
| Incident Response | Report generation, suggested containment | Execute containment |
| Threat Hunting | Runs the hunt query | Forms the hypothesis |
| Malware Analysis | Summarises findings | Manual decompile (jadx/apktool) |
| Deception (honeypot) | Alerts when decoy is touched | Plants the decoy |

## Context diagram

```mermaid
flowchart LR
    analyst([Mobile SOC analyst])
    device([Monitored Android / iOS device])
    llm([OpenAI GPT])
    system[[Mobile AI SOC Analyst system]]

    device -->|on-device signals| system
    system -->|alerts, IR reports| analyst
    analyst -->|hunt hypotheses, containment| system
    system <-->|reasoning requests| llm
```

## Container diagram

```mermaid
flowchart TB
    subgraph Device
        MC[Mobile client - Expo / React Native]
    end
    subgraph Cloud[Backend - Azure Container Apps]
        API[FastAPI service]
        AG[Agent service - Pydantic AI]
        RAG[(ChromaDB - ATT&CK + MASTG)]
        LOG[(Signal + alert store)]
    end
    LLM([OpenAI API])

    MC -->|TLS: signals| API
    API --> AG
    AG -->|retrieve technique context| RAG
    AG -->|reason| LLM
    AG -->|persist alerts/events| LOG
    API -->|alerts, reports| MC
```

## Agent component diagram

```mermaid
flowchart TB
    subgraph Agent[Pydantic AI agent]
        CTX[RunContext deps: settings, RAG client, log store]
        T1[Tool: signal triage]
        T2[Tool: ATT&CK correlation]
        T3[Tool: hunt query]
        T4[Tool: malware summary]
        T5[Tool: IR report generator]
        RET[RAG retriever]
    end
    CTX --> T1 --> T2
    T2 --> RET
    T3 --> RET
    T5 --> T2
    RET -->|technique context| T2
```

The mobile client collects signals (FR-001) and renders the dashboard (FR-006); the agent performs triage/correlation (FR-002, FR-003), hunting (FR-005), malware summary (FR-008), and IR reporting (FR-004), persisting every alert for audit (FR-009).
