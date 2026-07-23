# System design

Runtime design: the detection path, data flow, data model, API surface, RAG pipeline, and deployment. See [Architecture](architecture.md) for the static structure.

## Detection sequence

```mermaid
sequenceDiagram
    participant D as Mobile client
    participant A as FastAPI
    participant G as Agent (Pydantic AI)
    participant R as ChromaDB (RAG)
    participant L as LLM (Claude)
    participant S as Signal/Alert store

    D->>A: POST /signals (TLS)
    A->>G: triage(signals)
    G->>R: retrieve ATT&CK context
    R-->>G: matching technique docs
    G->>L: classify + map + rationale
    L-->>G: technique + confidence + rationale
    G->>S: persist event + alert
    G-->>A: alert(s)
    A-->>D: alert + technique + timestamp
```

## Data flow

```mermaid
flowchart LR
    C[Collectors: permissions, apps, jobs, network] --> N[Normalised signal]
    N --> Q[Triage + correlation]
    Q --> AL[Alert with ATT&CK mapping]
    AL --> DB[(Event/alert store)]
    AL --> UI[Dashboard]
    DB --> HUNT[Threat-hunting queries]
```

## Alert / event data model

```mermaid
erDiagram
    DEVICE ||--o{ SIGNAL : emits
    SIGNAL ||--o{ EVENT : "triaged into"
    EVENT ||--o{ ALERT : "raises"
    TECHNIQUE ||--o{ ALERT : "mapped by"

    DEVICE { string device_id string platform }
    SIGNAL { string signal_id string type json payload datetime observed_at }
    EVENT { string event_id string verdict float confidence string rationale }
    ALERT { string alert_id string severity datetime raised_at }
    TECHNIQUE { string attack_id string name string url }
```

## API surface (sketch)
| Method | Path | Purpose | Requirement |
|---|---|---|---|
| POST | `/signals` | Ingest a batch of on-device signals | FR-001 |
| GET | `/alerts` | List alerts for the dashboard | FR-006 |
| POST | `/hunt` | Run an analyst hunt query over history | FR-005 |
| POST | `/reports/ir` | Generate an IR report for an incident | FR-004 |
| POST | `/decoy/event` | Report honeypot access | FR-007 |

All endpoints require authentication (NFR-004) over TLS (NFR-003).

## RAG pipeline
1. **Ingest** the ATT&CK Mobile matrix + OWASP MASTG into ChromaDB (chunk + embed).
2. **Retrieve** technique context for a normalised signal at triage time.
3. **Ground** the LLM classification in the retrieved technique docs so mappings cite a real ATT&CK ID.

## Deployment

```mermaid
flowchart TB
    subgraph AWS[AWS - provisioned via Terraform]
        subgraph ECS[ECS Fargate]
            SVC[FastAPI + Agent container]
        end
        VEC[(ChromaDB volume)]
        STORE[(Event/alert store)]
    end
    MOB([Mobile client]) -->|TLS| SVC
    SVC --> VEC
    SVC --> STORE
    SVC -->|HTTPS| CLAUDE([Anthropic Claude API])
```
