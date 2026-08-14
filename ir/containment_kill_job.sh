#!/usr/bin/env bash
# Containment + Eradication for the poc-apk PoC: stop the running process
# (halts the foreground service, T1541) and clear the app's persisted
# WorkManager registration (removes the scheduled job, T1603).
#
# force-stop alone is containment — Android moves the package to a
# "stopped" state and won't wake it for JobScheduler/WorkManager/alarms
# until the app is opened again, so this immediately halts the beacon
# without touching app data. `pm clear` is the eradication follow-up: it
# wipes the app's stored WorkManager job registration so the periodic job
# doesn't just re-arm the next time someone launches the app.
#
# Usage: ./containment_kill_job.sh
set -euo pipefail

PKG="com.utiltools.flashlight"

echo "[containment] force-stopping $PKG"
adb shell am force-stop "$PKG"

echo "[containment] verifying: foreground service should no longer be running"
if adb shell dumpsys activity services "$PKG" 2>/dev/null | grep -q "ForegroundPersistenceService"; then
  echo "WARNING: ForegroundPersistenceService still listed for $PKG"
else
  echo "confirmed: no active service for $PKG"
fi

echo
echo "[eradication] clearing app data to remove the persisted WorkManager job registration"
adb shell pm clear "$PKG"

echo "[eradication] verifying: no jobscheduler entries should remain for $PKG"
if adb shell dumpsys jobscheduler 2>/dev/null | grep -q "$PKG"; then
  echo "WARNING: jobscheduler entries still present for $PKG"
else
  echo "confirmed: no jobscheduler entries for $PKG"
fi
