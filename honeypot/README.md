# honeypot

Decoy artifact + access instrumentation, per [docs/03-defense/deception.md](../docs/03-defense/deception.md).
Not an agent task to create — only to alert on access.

- `plant_decoy.sh` — plants a decoy file/credential no legitimate app should touch
- `instrument_access.py` — logs access attempts, calls backend `POST /decoy/event`

**Not yet implemented.**
