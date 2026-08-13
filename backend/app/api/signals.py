"""POST /signals — ingest a batch of on-device signals (FR-001), triage +
correlate each via the agent, persist Event/Alert, return alerts (NFR-001:
<60s p95 triage latency)."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.agents.agent import run_triage
from app.agents.deps import AgentDeps
from app.api.deps import require_api_key
from app.models import Alert, SignalBatchRequest, Verdict
from app.store.db import get_session
from app.store.repository import (
    ensure_technique,
    persist_event,
    persist_signal,
    raise_alert,
)

router = APIRouter()


def _severity_for(confidence: float) -> str:
    if confidence >= 0.85:
        return "high"
    if confidence >= 0.5:
        return "medium"
    return "low"


@router.post("/signals", dependencies=[Depends(require_api_key)])
async def ingest_signals(
    batch: SignalBatchRequest,
    session: Session = Depends(get_session),
) -> list[Alert]:
    deps = AgentDeps(session=session)
    alerts: list[Alert] = []

    for signal_in in batch.signals:
        signal = persist_signal(session, signal_in)
        triage = await run_triage(deps, signal)

        event = persist_event(
            session,
            signal,
            verdict=triage.verdict,
            confidence=triage.confidence,
            rationale=triage.rationale,
        )

        if triage.verdict == Verdict.SUSPICIOUS:
            if triage.attack_id:
                ensure_technique(
                    session,
                    triage.attack_id,
                    name=triage.attack_id,
                    url=f"https://attack.mitre.org/techniques/{triage.attack_id.replace('.', '/')}/",
                )
            alert = raise_alert(
                session,
                event,
                attack_id=triage.attack_id,
                severity=_severity_for(triage.confidence),
            )
            alerts.append(alert)

    return alerts
