# Deception (Honeypot)

A planted decoy artifact whose only purpose is to generate a high-confidence alert when touched. This is not an agent task — the agent's role is to **alert when the decoy is accessed**.

## Setup

- Plant a decoy file / credential that no legitimate app should ever read (e.g. a fake "credentials" file or token).
- Instrument access so a read/exfil attempt is logged.

## Implementation

The honeypot lives in [honeypot/](../../honeypot/):

- `plant_decoy.sh` plants a credential-shaped decoy file (`sys_backup_credentials.txt`) onto the isolated emulator over `adb` (or a host directory with `--local`) and records a manifest (`planted.json`). The contents are obviously fake and safe to exfiltrate in the lab.
- `instrument_access.py` polls the decoy's stat (atime/mtime/ctime) and, on the first change after planting, appends evidence to `access_log.jsonl` and reports the access to the backend.
- Backend `POST /decoy/event` persists the access as a `decoy_access` signal and raises the alert (see API surface in [System Design](../engineering/system-design.md)).

Lab trigger for the demo: `adb shell cat /sdcard/Documents/sys_backup_credentials.txt` — a read no legitimate app would ever perform.

## Detection

- Any access to the decoy is treated as high-signal (FR-007): the backend raises an immediate `high`-severity alert with confidence 1.0 — deterministically, without an LLM round trip, because every access is a true positive by construction. The analyst then correlates the accessing process with the kill-chain timeline.

## Next steps

- [x] Set up the honeypot / decoy artifact and its access instrumentation.
