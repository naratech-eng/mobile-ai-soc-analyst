#!/usr/bin/env python3
"""instrument_access.py — watch the planted decoy and alert the SOC backend
on any access, per docs/03-defense/deception.md (FR-007).

Lab-only. Polls the decoy's stat (atime/mtime/ctime) — via `adb shell stat`
for an emulator-planted decoy, or os.stat for a host-planted one — and the
first change after planting is treated as a high-signal access: logged to
honeypot/access_log.jsonl for evidence and POSTed to the backend's
POST /decoy/event, which raises the high-severity alert.

Config via env:
  BACKEND_URL      default http://localhost:8000
  BACKEND_API_KEY  default change-me-lab-only (match backend/.env)
  DEVICE_ID        default honeypot-lab
  POLL_SECONDS     default 2

Usage: python3 instrument_access.py [--manifest planted.json] [--accessor NAME]
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ACCESS_LOG = SCRIPT_DIR / "access_log.jsonl"


def stat_adb(path: str) -> tuple[int, int, int, int]:
    out = subprocess.run(
        ["adb", "shell", "stat", "-c", "%X %Y %Z %s", path],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    return tuple(int(v) for v in out)  # type: ignore[return-value]


def stat_local(path: str) -> tuple[int, int, int, int]:
    st = os.stat(path)
    return int(st.st_atime), int(st.st_mtime), int(st.st_ctime), int(st.st_size)


def post_decoy_event(backend_url: str, api_key: str, body: dict) -> bool:
    req = urllib.request.Request(
        f"{backend_url.rstrip('/')}/decoy/event",
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"[decoy] alert raised: {resp.status} {resp.read().decode()}")
            return True
    except Exception as exc:
        # Backend unreachable must not stop instrumentation — the local
        # JSONL log is the evidence of record; retry happens on next change.
        print(f"[decoy] WARN backend POST failed ({exc!r}); event still logged locally", flush=True)
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", default=str(SCRIPT_DIR / "planted.json"))
    parser.add_argument("--accessor", default=None,
                        help="Actor to attribute the access to (e.g. the PoC package name)")
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text())
    decoy_id, mode, baseline_sha = manifest["decoy_id"], manifest["mode"], manifest["sha256"]

    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    api_key = os.environ.get("BACKEND_API_KEY", "change-me-lab-only")
    device_id = os.environ.get("DEVICE_ID", "honeypot-lab")
    poll = float(os.environ.get("POLL_SECONDS", "2"))

    get_stat = stat_adb if mode == "adb" else stat_local
    baseline = get_stat(decoy_id)
    print(f"[decoy] watching {decoy_id} (mode={mode}, baseline atime/mtime/ctime/size={baseline})")

    while True:
        time.sleep(poll)
        try:
            current = get_stat(decoy_id)
        except Exception as exc:
            print(f"[decoy] WARN stat failed ({exc!r}); retrying", flush=True)
            continue
        if current == baseline:
            continue

        event = {
            "decoy_id": decoy_id,
            "mode": mode,
            "planted_sha256": baseline_sha,
            "accessor": args.accessor,
            "stat_before": baseline,
            "stat_after": current,
            "observed_at": datetime.now(timezone.utc).isoformat(),
        }
        print(f"[decoy] ACCESS DETECTED: {event}", flush=True)
        with ACCESS_LOG.open("a") as fh:
            fh.write(json.dumps(event) + "\n")

        post_decoy_event(backend_url, api_key, {
            "device_id": device_id,
            "platform": "android" if mode == "adb" else "linux",
            "decoy_id": decoy_id,
            "accessor": args.accessor,
            "observed_at": event["observed_at"],
        })
        baseline = current  # keep watching; each subsequent touch alerts too


if __name__ == "__main__":
    sys.exit(main())
