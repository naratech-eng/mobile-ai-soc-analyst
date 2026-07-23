# Deception (Honeypot)

A planted decoy artifact whose only purpose is to generate a high-confidence alert when touched. This is not an agent task — the agent's role is to **alert when the decoy is accessed**.

## Setup

- Plant a decoy file / credential that no legitimate app should ever read (e.g. a fake "credentials" file or token).
- Instrument access so a read/exfil attempt is logged.

## Detection

- Any access to the decoy is treated as high-signal: the agent raises an immediate alert and correlates the accessing process with the kill-chain timeline.

## Next steps

- [ ] Set up the honeypot / decoy artifact and its access instrumentation.
