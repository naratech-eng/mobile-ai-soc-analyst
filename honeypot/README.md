# honeypot

Decoy artifact + access instrumentation, per [docs/03-defense/deception.md](../docs/03-defense/deception.md).
Not an agent task to create — only to alert on access.

> Lab-only: the decoy is planted on the isolated Genymotion emulator (or a
> host directory), never a personal device. Contents are obviously fake.

## Files

- `plant_decoy.sh` — plants a decoy file/credential no legitimate app should touch, and writes `planted.json`
- `instrument_access.py` — logs access attempts to `access_log.jsonl`, calls backend `POST /decoy/event`

## Usage

```bash
./plant_decoy.sh                 # plant on the connected emulator (adb)
./plant_decoy.sh --local ./decoys  # or plant on this host

BACKEND_URL=http://localhost:8000 \
BACKEND_API_KEY=change-me-lab-only \
python3 instrument_access.py     # start watching; Ctrl+C to stop
```

Trigger an alert in the lab (a read no legitimate app would perform):

```bash
adb shell cat /sdcard/Documents/sys_backup_credentials.txt
```

The backend raises a `high`-severity alert (confidence 1.0) on any access —
deterministically, no LLM round trip (FR-007).
