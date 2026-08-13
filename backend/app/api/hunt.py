"""POST /hunt — analyst-supplied keyword query over historical signals
(FR-005, TH-01). The hypothesis is the analyst's; this executes it."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import require_api_key
from app.models import HuntMatch, HuntRequest, HuntResult
from app.store.db import get_session
from app.store.repository import search_signals

router = APIRouter()


@router.post("/hunt", dependencies=[Depends(require_api_key)])
def run_hunt(body: HuntRequest, session: Session = Depends(get_session)) -> HuntResult:
    signals = search_signals(session, body.query)
    return HuntResult(
        query=body.query,
        matches=[
            HuntMatch(
                signal_id=s.signal_id,
                device_id=s.device_id,
                type=s.type,
                matched_reason=f"'{body.query}' matched signal type/payload",
                observed_at=s.observed_at,
            )
            for s in signals
        ],
    )
