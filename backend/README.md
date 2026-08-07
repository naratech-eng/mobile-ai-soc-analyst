# backend

FastAPI service + Pydantic AI agent implementing the detection/response
core described in [docs/engineering/architecture.md](../docs/engineering/architecture.md)
and [docs/engineering/system-design.md](../docs/engineering/system-design.md).

- `app/api/` — routers: `POST /signals`, `GET /alerts`, `POST /hunt`, `POST /reports/ir`, `POST /decoy/event`
- `app/agents/` — Pydantic AI agent, tools, `RunContext` deps
- `app/rag/` — ChromaDB ingestion (ATT&CK Mobile + OWASP MASTG) + retrieval
- `app/models/` — Pydantic schemas: Device, Signal, Event, Alert, Technique
- `app/store/` — signal/alert persistence + audit log
- `tests/` — unit + integration tests, fills the matrix in [docs/testing/test-strategy.md](../docs/testing/test-strategy.md)
