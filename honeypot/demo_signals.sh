#!/usr/bin/env bash
# Demo helper: sends signals to the backend simulating what a mobile EDR
# agent would detect from the PoC APK's kill-chain activities.
# Usage: ./demo_signals.sh [BACKEND_URL]
set -euo pipefail

BACKEND="${1:-http://localhost:8000}"
API_KEY="fa01135f410e56b92c4d2a65f6dcc8b1984d1e3dd49cd8c5dfd5419a67829c7b"
DEVICE="genymotion-poc-device"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Sending kill-chain signals to $BACKEND ..."

# T1474.003 — Supply Chain Compromise (app installed disguised as flashlight)
curl -s -X POST "$BACKEND/signals" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"signals\": [{
      \"device_id\": \"$DEVICE\",
      \"platform\": \"android\",
      \"type\": \"APP_INSTALL\",
      \"payload\": {
        \"package_name\": \"com.utiltools.torchlight\",
        \"app_label\": \"Flashlight\",
        \"source\": \"sideload\",
        \"sha256\": \"unknown\",
        \"permissions\": [\"CAMERA\", \"ACCESS_NETWORK_STATE\", \"ACCESS_WIFI_STATE\", \"INTERNET\", \"FOREGROUND_SERVICE\"]
      },
      \"observed_at\": \"$NOW\"
    }]
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

sleep 1

# T1422 — Network Recon (app reads WiFi/network state on launch)
curl -s -X POST "$BACKEND/signals" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"signals\": [{
      \"device_id\": \"$DEVICE\",
      \"platform\": \"android\",
      \"type\": \"NETWORK_RECON\",
      \"payload\": {
        \"package_name\": \"com.utiltools.torchlight\",
        \"action\": \"read_wifi_state\",
        \"api_calls\": [\"ConnectivityManager.getActiveNetwork\", \"WifiManager.getConnectionInfo\"],
        \"data_accessed\": [\"ssid\", \"bssid\", \"ip_address\", \"link_speed\"]
      },
      \"observed_at\": \"$NOW\"
    }]
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

sleep 1

# T1603 — Scheduled Job (WorkManager periodic job registered)
curl -s -X POST "$BACKEND/signals" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"signals\": [{
      \"device_id\": \"$DEVICE\",
      \"platform\": \"android\",
      \"type\": \"SCHEDULED_JOB\",
      \"payload\": {
        \"package_name\": \"com.utiltools.torchlight\",
        \"work_name\": \"poc_recon_job\",
        \"interval_minutes\": 15,
        \"policy\": \"KEEP\",
        \"via\": \"WorkManager.enqueueUniquePeriodicWork\"
      },
      \"observed_at\": \"$NOW\"
    }]
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

sleep 1

# T1541 — Foreground Persistence (foreground service started)
curl -s -X POST "$BACKEND/signals" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"signals\": [{
      \"device_id\": \"$DEVICE\",
      \"platform\": \"android\",
      \"type\": \"FOREGROUND_SERVICE\",
      \"payload\": {
        \"package_name\": \"com.utiltools.torchlight\",
        \"service_class\": \"ForegroundPersistenceService\",
        \"notification_text\": \"Flashlight running\",
        \"foreground_service_type\": \"dataSync\"
      },
      \"observed_at\": \"$NOW\"
    }]
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

sleep 1

# T1521 — C2 Beacon (TLS socket connection to C2 server)
curl -s -X POST "$BACKEND/signals" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"signals\": [{
      \"device_id\": \"$DEVICE\",
      \"platform\": \"android\",
      \"type\": \"C2_BEACON\",
      \"payload\": {
        \"package_name\": \"com.utiltools.torchlight\",
        \"destination\": \"10.0.3.2:8443\",
        \"protocol\": \"TLS\",
        \"beacon_data\": \"BEACON:network_recon\"
      },
      \"observed_at\": \"$NOW\"
    }]
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

echo ""
echo "Done! Check alerts:"
echo "  curl -H 'Authorization: Bearer $API_KEY' $BACKEND/alerts"
