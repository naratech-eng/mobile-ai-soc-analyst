import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import alerts, signals
from app.rag.ingest import ingest
from app.store.db import init_db


def _seed_rag() -> None:
    # CHROMA_PERSIST_DIR is local/ephemeral storage (not the Azure Files
    # mount — SQLite locking over SMB breaks ChromaDB's internal store), so
    # re-seed the ATT&CK technique docs on every cold start.
    #
    # NOTE: ChromaDB's default ONNX embedding model is memory-hungry; the
    # container is provisioned at 1.0 vCPU / 2Gi (see infra/container_apps.tf)
    # because it OOM-kills at 0.5/1Gi on the first embedding load.
    try:
        count = ingest()
        print(f"RAG: ingested {count} technique docs on startup", flush=True)
    except Exception as exc:  # never let a RAG stall take the whole app down
        print(f"WARN RAG: startup ingest failed ({exc!r}); "
              "correlation will fall back to no-match until it recovers.", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed off the request path in a daemon thread: ChromaDB init has been
    # observed to stall on the container, and blocking here would hang the
    # entire app (FastAPI serves nothing until lifespan startup returns).
    threading.Thread(target=_seed_rag, name="rag-seed", daemon=True).start()
    yield


app = FastAPI(
    title="Mobile AI SOC Analyst — Detection Backend",
    description="Tier-1 SOC analyst agent: triage + ATT&CK Mobile correlation.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(signals.router)
app.include_router(alerts.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
