#!/usr/bin/env bash
# Containment for the poc-apk PoC: revoke network access for the app
# specifically (not the whole device), by dropping its outbound traffic
# on-device via iptables — cuts the C2 channel (T1521) and exfil (T1646)
# without killing the process, so the process-kill and network-revoke
# containment actions can be demonstrated and evidenced independently.
#
# Requires the emulator to allow `adb root` (Genymotion images do by
# default). Run restore_network.sh to lift the block during the
# Recovery phase.
#
# Usage: ./containment_revoke_network.sh
set -euo pipefail

PKG="com.utiltools.flashlight"

echo "[containment] requesting root adb session"
adb root >/dev/null 2>&1 || true

APP_UID=$(adb shell dumpsys package "$PKG" | grep -m1 "userId=" | grep -oE '[0-9]+' | head -1)
if [ -z "${APP_UID:-}" ]; then
  echo "[containment] could not resolve UID for $PKG — is it installed?" >&2
  exit 1
fi

echo "[containment] blocking all outbound traffic for $PKG (uid=$APP_UID)"
adb shell iptables -I OUTPUT -m owner --uid-owner "$APP_UID" -j DROP

echo "[containment] active rule:"
adb shell iptables -L OUTPUT -n --line-numbers | grep -E "DROP|Chain OUTPUT" || true

echo
echo "[containment] network access revoked for $PKG (uid=$APP_UID)."
echo "Verify by triggering the recon job again — no new beacon/exfil should reach poc-c2-server."
