"""The report-writer agent (FR-004): turns a persisted incident (Alert ->
Event -> Signal -> Technique) into a four-stage IR narrative. A separate
agent/role from triage_agent (agent.py) — same "Tier-1 SOC analyst" model,
different job: writing up an already-raised alert rather than triaging a
new signal."""

from datetime import datetime, timezone

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from app.agents.tools.containment_reference import CONTAINMENT_PLAYBOOK
from app.models import Alert, Event, IrReportResult, IrReportSection, Signal, Technique

REPORT_MODEL = "openai:gpt-4o-mini"


class ReportNarrative(BaseModel):
    """What the LLM actually writes — the endpoint fills in incident_id and
    generated_at deterministically rather than trusting the model with them."""

    summary: str = Field(description="1-3 sentence incident summary, plain language")
    preparation: str
    detection_and_analysis: str
    containment_eradication_recovery: str
    post_event_activity: str


report_agent = Agent(
    REPORT_MODEL,
    output_type=ReportNarrative,
    system_prompt=(
        "You are a Tier-1 SOC analyst writing an incident-response report "
        "for a Tier-2/3 analyst to review. You are given one already-raised "
        "alert with its source signal, verdict, and (if correlated) ATT&CK "
        "Mobile technique, plus a description of the containment/recovery "
        "scripts actually available in this lab. Write four sections: "
        "Preparation (the lab/detection-pipeline state before the incident), "
        "Detection & Analysis (what was observed and how it was correlated — "
        "cite the technique ID if one is given), Containment/Eradication/"
        "Recovery (which of the provided scripts apply to this alert's "
        "technique and why — do not invent actions beyond what's described), "
        "and Post-Event Activity (evidence retained, recommended follow-up). "
        "Keep each section 2-4 sentences, factual, and grounded only in the "
        "incident data and containment scripts given to you — never invent "
        "timestamps, technique IDs, or containment tools that weren't given."
    ),
)


def format_incident_for_report(
    alert: Alert, event: Event, signal: Signal, technique: Technique | None
) -> str:
    technique_line = (
        f"Correlated technique: {technique.attack_id} ({technique.name})"
        if technique
        else "Correlated technique: none (no ATT&CK match at triage time)"
    )
    return (
        f"Alert ID: {alert.alert_id}\n"
        f"Severity: {alert.severity}\n"
        f"Raised at: {alert.raised_at.isoformat()}\n"
        f"{technique_line}\n\n"
        f"Verdict: {event.verdict.value} (confidence {event.confidence:.2f})\n"
        f"Triage rationale: {event.rationale}\n\n"
        f"Source signal type: {signal.type.value}\n"
        f"Source signal payload: {signal.payload}\n"
        f"Source signal observed at: {signal.observed_at.isoformat()}\n\n"
        f"Available containment/recovery scripts:\n{CONTAINMENT_PLAYBOOK}"
    )


async def run_report_generation(
    alert: Alert, event: Event, signal: Signal, technique: Technique | None
) -> IrReportResult:
    prompt = format_incident_for_report(alert, event, signal, technique)
    result = await report_agent.run(prompt)
    narrative = result.output

    return IrReportResult(
        incident_id=alert.alert_id,
        generated_at=datetime.now(timezone.utc),
        summary=narrative.summary,
        sections=[
            IrReportSection(id="preparation", title="Preparation", body=narrative.preparation),
            IrReportSection(
                id="detection",
                title="Detection & Analysis",
                body=narrative.detection_and_analysis,
            ),
            IrReportSection(
                id="containment",
                title="Containment, Eradication & Recovery",
                body=narrative.containment_eradication_recovery,
            ),
            IrReportSection(
                id="post_event",
                title="Post-Event Activity",
                body=narrative.post_event_activity,
            ),
        ],
    )
