"""Integration test: POST /decoy/event -> immediate high-severity alert
(TC-DECOY / FR-007). Deterministic — no LLM call is made on the decoy path,
so no TestModel override is needed."""


def test_decoy_event_requires_auth(client):
    response = client.post(
        "/decoy/event",
        json={"device_id": "test-device-1", "decoy_id": "/sdcard/decoy.txt"},
    )
    assert response.status_code == 401


def test_decoy_event_raises_high_confidence_alert(client, auth_headers):
    response = client.post(
        "/decoy/event",
        headers=auth_headers,
        json={
            "device_id": "test-device-1",
            "platform": "android",
            "decoy_id": "/sdcard/Documents/sys_backup_credentials.txt",
            "accessor": "com.utiltools.flashlight",
        },
    )

    assert response.status_code == 201
    alert = response.json()
    assert alert["severity"] == "high"
    assert alert["attack_id"] is None

    # The decoy alert must be visible on the dashboard feed (FR-006/FR-009).
    alerts = client.get("/alerts", headers=auth_headers).json()
    assert any(a["alert_id"] == alert["alert_id"] for a in alerts)
