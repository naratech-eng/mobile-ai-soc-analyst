#!/usr/bin/env bash
# Recovery: lifts the network block applied by containment_revoke_network.sh
# once the incident is closed out, restoring the device to its pre-incident
# (but still-infected-until-uninstalled) network state.
#
# Usage: ./recovery_restore_network.sh
set -euo pipefail

PKG="com.utiltools.flashlight"

adb root >/dev/null 2>&1 || true

APP_UID=$(adb shell dumpsys package "$PKG" | grep -m1 "userId=" | grep -oE '[0-9]+' | head -1)
if [ -z "${APP_UID:-}" ]; then
  echo "[recovery] could not resolve UID for $PKG — is it installed?" >&2
  exit 1
fi

echo "[recovery] removing iptables DROP rule for $PKG (uid=$APP_UID)"
if adb shell iptables -D OUTPUT -m owner --uid-owner "$APP_UID" -j DROP 2>/dev/null; then
  echo "confirmed: rule removed"
else
  echo "no matching rule found (already clean)"
fi
