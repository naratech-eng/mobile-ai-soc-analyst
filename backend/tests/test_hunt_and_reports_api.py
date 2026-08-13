"""POST /hunt (TH-01) and POST /reports/ir (FR-004)."""

from pydantic_ai.models.test import TestModel

from app.agents.agent import TriageResult, triage_agent
from app.agents.report_agent import ReportNarrative, report_agent
from app.models import Verdict


def _raise_suspicious_alert(client, auth_headers):
    stub = TriageResult(
        verdict=Verdict.SUSPICIOUS,
        confidence=0.9,
        rationale="Scheduled job registered shortly after install.",
        attack_id="T1603",
    )
    with triage_agent.override(model=TestModel(custom_output_args=stub)):
        client.post(
            "/signals",
            headers=auth_headers,
            json={
                "signals": [
                    {
                        "device_id": "hunt-test-device",
                        "platform": "android",
                        "type": "scheduled_job",
                        "payload": {"job_name": "poc_recon_job", "interval_min": 15},
                    }
                ]
            },
        )


def test_hunt_requires_auth(client):
    response = client.post("/hunt", json={"query": "scheduled_job"})
    assert response.status_code == 401


def test_hunt_matches_persisted_signal(client, auth_headers):
    _raise_suspicious_alert(client, auth_headers)

    response = client.post("/hunt", headers=auth_headers, json={"query": "poc_recon_job"})
    assert response.status_code == 200
    result = response.json()
    assert result["query"] == "poc_recon_job"
    assert len(result["matches"]) == 1
    assert result["matches"][0]["device_id"] == "hunt-test-device"


def test_hunt_no_match_returns_empty(client, auth_headers):
    _raise_suspicious_alert(client, auth_headers)

    response = client.post("/hunt", headers=auth_headers, json={"query": "nonexistent-xyz"})
    assert response.status_code == 200
    assert response.json()["matches"] == []


def test_ir_report_requires_auth(client):
    response = client.post("/reports/ir", json={})
    assert response.status_code == 401


def test_ir_report_404_with_no_alerts(client, auth_headers):
    response = client.post("/reports/ir", headers=auth_headers, json={})
    assert response.status_code == 404


def test_ir_report_generates_four_sections(client, auth_headers):
    _raise_suspicious_alert(client, auth_headers)

    stub_narrative = ReportNarrative(
        summary="Suspicious scheduled job detected and correlated to T1603.",
        preparation="Lab environment isolated; detection pipeline live.",
        detection_and_analysis="scheduled_job signal triaged suspicious, correlated to T1603.",
        containment_eradication_recovery="force-stop halts the job; pm clear erases registration.",
        post_event_activity="Alert record retained for audit.",
    )
    with report_agent.override(model=TestModel(custom_output_args=stub_narrative)):
        response = client.post("/reports/ir", headers=auth_headers, json={})

    assert response.status_code == 200
    report = response.json()
    assert report["summary"] == stub_narrative.summary
    section_ids = [s["id"] for s in report["sections"]]
    assert section_ids == ["preparation", "detection", "containment", "post_event"]
