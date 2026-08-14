"""POST /reports/ir — generate an incident-response report for an alert
(FR-004), covering all four IR lifecycle stages."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.agents.report_agent import run_report_generation
from app.api.deps import require_api_key
from app.models import IrReportRequest, IrReportResult
from app.store.db import get_session
from app.store.repository import get_alert_context

router = APIRouter()


@router.post("/reports/ir", dependencies=[Depends(require_api_key)])
async def generate_ir_report(
    body: IrReportRequest, session: Session = Depends(get_session)
) -> IrReportResult:
    context = get_alert_context(session, body.alert_id)
    if context is None:
        raise HTTPException(status_code=404, detail="No alert found to report on")

    alert, event, signal, technique = context
    return await run_report_generation(alert, event, signal, technique)
