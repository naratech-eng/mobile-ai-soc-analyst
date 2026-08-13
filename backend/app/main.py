from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import alerts, signals
from app.rag.ingest import ingest
from app.store.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # CHROMA_PERSIST_DIR is local/ephemeral storage (not the Azure Files
    # mount — SQLite locking over SMB breaks ChromaDB's internal store), so
    # re-seed the ATT&CK technique docs on every cold start. Upsert-based
    # and a handful of docs, so this is cheap.
    ingest()
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
