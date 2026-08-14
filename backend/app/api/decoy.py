"""POST /decoy/event — report an access to a planted honeypot decoy artifact
(FR-007 / TC-DECOY, docs/03-defense/deception.md).

Decoy access is definitionally high-signal: no legitimate app should ever
touch the artifact. The alert is therefore raised deterministically
(verdict=suspicious, confidence=1.0, severity=high) without an LLM round
trip — triage latency is irrelevant when every access is a true positive.
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import require_api_key
from app.models import Alert, DecoyEventIn, SignalIn, SignalType, Verdict
from app.store.db import get_session
from app.store.repository import persist_event, persist_signal, raise_alert

router = APIRouter()


@router.post("/decoy/event", dependencies=[Depends(require_api_key)], status_code=201)
def report_decoy_event(
    event_in: DecoyEventIn,
    session: Session = Depends(get_session),
) -> Alert:
    signal = persist_signal(
        session,
        SignalIn(
            device_id=event_in.device_id,
            platform=event_in.platform,
            type=SignalType.DECOY_ACCESS,
            payload={
                "decoy_id": event_in.decoy_id,
                "accessor": event_in.accessor,
            },
            observed_at=event_in.observed_at,
        ),
    )

    accessor_note = f" by {event_in.accessor}" if event_in.accessor else ""
    event = persist_event(
        session,
        signal,
        verdict=Verdict.SUSPICIOUS,
        confidence=1.0,
        rationale=(
            f"Honeypot decoy '{event_in.decoy_id}' accessed{accessor_note}. "
            "No legitimate app should touch this artifact — treat as "
            "high-confidence malicious and correlate with the kill-chain "
            "timeline (docs/03-defense/deception.md)."
        ),
    )

    return raise_alert(session, event, attack_id=None, severity="high")
