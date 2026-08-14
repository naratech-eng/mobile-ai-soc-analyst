#!/usr/bin/env bash
# plant_decoy.sh — plant a honeypot decoy artifact that no legitimate app
# should ever read, per docs/03-defense/deception.md.
#
# Lab-only. Targets the isolated Genymotion emulator over adb (default) or a
# local directory (--local <dir>) for host-side demos. Writes a manifest to
# honeypot/planted.json that instrument_access.py watches against.
#
# Usage:
#   ./plant_decoy.sh                     # plant on the connected emulator
#   ./plant_decoy.sh --local ./decoys    # plant on this host instead
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/planted.json"
DECOY_NAME="sys_backup_credentials.txt"
DEVICE_PATH="/sdcard/Documents/$DECOY_NAME"

# Obviously fake, obviously a decoy — safe to exfiltrate in the lab, useless
# anywhere else. Content is intentionally credential-shaped so a scanner or
# hands-on-keyboard actor goes for it.
DECOY_CONTENTS="# LAB DECOY — planted by honeypot/plant_decoy.sh. Not a real credential.
# Any read of this file is reported to the SOC backend as a decoy event.
backup_user=svc-backup
backup_pass=DEC0Y-not-a-real-password
api_token=decoy-token-0000-0000-0000
"

write_manifest() {
    # $1 = mode (adb|local), $2 = path, $3 = sha256
    cat > "$MANIFEST" <<EOF
{
  "decoy_id": "$2",
  "mode": "$1",
  "sha256": "$3",
  "planted_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    echo "[plant_decoy] manifest written to $MANIFEST"
}

sha_of() { shasum -a 256 | awk '{print $1}'; }

if [[ "${1:-}" == "--local" ]]; then
    DIR="${2:?--local requires a target directory}"
    mkdir -p "$DIR"
    TARGET="$DIR/$DECOY_NAME"
    rm -f "$TARGET"  # a previous plant is chmod 444 — remove before rewriting
    printf '%s' "$DECOY_CONTENTS" > "$TARGET"
    chmod 444 "$TARGET"
    SHA=$(sha_of < "$TARGET")
    write_manifest "local" "$TARGET" "$SHA"
    echo "[plant_decoy] decoy planted at $TARGET (sha256=$SHA)"
else
    command -v adb >/dev/null || { echo "[plant_decoy] adb not found — install platform-tools or use --local" >&2; exit 1; }
    adb shell "mkdir -p /sdcard/Documents"
    adb shell "rm -f $DEVICE_PATH"  # a previous plant is chmod 444
    printf '%s' "$DECOY_CONTENTS" | adb shell "cat > $DEVICE_PATH"
    adb shell "chmod 444 $DEVICE_PATH"
    SHA=$(adb shell "cat $DEVICE_PATH" | sha_of)
    write_manifest "adb" "$DEVICE_PATH" "$SHA"
    echo "[plant_decoy] decoy planted at $DEVICE_PATH on $(adb get-serialno) (sha256=$SHA)"
fi

echo "[plant_decoy] next: ./instrument_access.py — any access to the decoy will alert the SOC backend."
