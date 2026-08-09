"""GET /alerts — list alerts for the dashboard (FR-006)."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import require_api_key
from app.models import Alert
from app.store.db import get_session
from app.store.repository import list_alerts

router = APIRouter()


@router.get("/alerts", dependencies=[Depends(require_api_key)])
def get_alerts(session: Session = Depends(get_session)) -> list[Alert]:
    return list_alerts(session)
