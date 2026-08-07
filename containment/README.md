# containment

IR containment scripts, per [docs/03-defense/incident-response.md](../docs/03-defense/incident-response.md).
Human-executed, agent-documented — not autonomous.

- `kill_job.sh` — identify the malicious scheduled job via `dumpsys jobscheduler`, cancel it (or uninstall the PoC package)
- `revoke_network.sh` — block the PoC app's network access

Script output feeds the IR report tool (`backend/app/agents/tools/ir_report.py`)
as containment evidence. **Not yet implemented.**
