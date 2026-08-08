"""Integration test: POST /signals -> triage -> alert round-trip (TC-COLLECT,
TC-TRIAGE). The agent's LLM call is stubbed with Pydantic AI's TestModel so
this runs without a real OpenAI key."""

from pydantic_ai.models.test import TestModel

from app.agents.agent import TriageResult, triage_agent
from app.models import Verdict


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signals_requires_auth(client):
    response = client.post("/signals", json={"signals": []})
    assert response.status_code == 401


def test_signal_ingest_raises_alert_for_suspicious_signal(client, auth_headers):
    stub_result = TriageResult(
        verdict=Verdict.SUSPICIOUS,
        confidence=0.9,
        rationale="Scheduled job registered shortly after install, matching known persistence behavior.",
        attack_id="T1603",
    )

    with triage_agent.override(model=TestModel(custom_output_args=stub_result)):
        response = client.post(
            "/signals",
            headers=auth_headers,
            json={
                "signals": [
                    {
                        "device_id": "test-device-1",
                        "platform": "android",
                        "type": "scheduled_job",
                        "payload": {"job_name": "poc_recon_job", "interval_min": 15},
                    }
                ]
            },
        )

    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert alerts[0]["attack_id"] == "T1603"
    assert alerts[0]["severity"] == "high"


def test_alerts_endpoint_lists_raised_alerts(client, auth_headers):
    stub_result = TriageResult(
        verdict=Verdict.BENIGN,
        confidence=0.95,
        rationale="Normal Wi-Fi connectivity check, no suspicious pattern.",
        attack_id=None,
    )

    with triage_agent.override(model=TestModel(custom_output_args=stub_result)):
        client.post(
            "/signals",
            headers=auth_headers,
            json={
                "signals": [
                    {
                        "device_id": "test-device-2",
                        "platform": "android",
                        "type": "network_activity",
                        "payload": {"transport": "wifi"},
                    }
                ]
            },
        )

    response = client.get("/alerts", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []  # benign signal raises no alert
