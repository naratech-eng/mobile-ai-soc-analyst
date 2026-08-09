# Incident Response scripts

Containment/eradication/recovery actions for the `poc-apk` PoC, run against
the isolated lab emulator via `adb`. These are deliberately **scripted and
manually triggered** — not agent-executed — per the project's Tier-1/Tier-2
split: the backend agent (`backend/app/agents/`) triages and correlates
signals and later summarizes the incident into a report, but taking the
actual containment action (kill a process, revoke network) stays a human
call, then gets documented after the fact. See the root
[CLAUDE.md](../CLAUDE.md) "Key Framing" table.

## Maps to the IR lifecycle

| Phase | Script | What it does |
|---|---|---|
| Containment | `containment_kill_job.sh` | `am force-stop` — halts the running process (kills the T1541 foreground service, stops the T1603 job from firing again until the app is relaunched) |
| Eradication | `containment_kill_job.sh` (second half) | `pm clear` — wipes the app's persisted WorkManager registration so the scheduled job doesn't just re-arm |
| Containment | `containment_revoke_network.sh` | on-device `iptables` DROP rule scoped to the app's UID — cuts the T1521/T1646 C2+exfil channel independently of killing the process, so the two containment actions can be demonstrated and evidenced separately |
| Recovery | `recovery_restore_network.sh` | removes the `iptables` rule once the incident is closed |

(Preparation and Detection & Analysis happen elsewhere — the isolated lab
setup and the agent's triage pipeline, respectively.)

## Usage

Requires `adb` on `PATH` and the emulator running with `poc-apk` installed
and its recon job already firing (see `poc-apk/README` / the kill-chain
walkthrough in the root `CLAUDE.md`).

```bash
chmod +x ir/*.sh   # already committed executable, but just in case

./ir/containment_kill_job.sh        # containment + eradication: stop the process, clear its scheduled job
./ir/containment_revoke_network.sh  # containment: cut network access for just this app
./ir/recovery_restore_network.sh    # recovery: lift the network block
```

Each script logs `[containment]`/`[eradication]`/`[recovery]`-tagged lines
to stdout and verifies its own effect (checking `dumpsys activity
services`, `dumpsys jobscheduler`, or the `iptables` rule table) — capture
this output alongside `poc-c2-server`'s logs (no further beacons/exfil
after containment) as the evidence for the video's IR segment.

`containment_revoke_network.sh` needs `adb root` (Genymotion images allow
this by default) since blocking traffic by UID via `iptables` requires
root inside the emulator.
