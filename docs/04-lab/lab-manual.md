# Lab Manual

Reproducible steps for the detection demo. Grading weight: 1/3 lab, 2/3 research.

## Environment

- Android emulator (isolated) or wiped burner device — **never** a personal device.
- Sandboxed network; test C2 server under my control.
- Tooling: `adb`, `jadx`, `apktool`, Wireshark, OBS Studio (recording).

## Procedure

1. **Framing (30–60s)** — state that this is a self-built PoC implementing named ATT&CK Mobile techniques in an isolated lab, to validate detection logic.
2. **Show isolated environment** — emulator/test device, sandboxed network.
3. **Baseline "before" state** — clean device, no alerts.
4. **Execute the attack chain phase by phase**, narrating and showing raw evidence (logcat, `dumpsys jobscheduler`, Wireshark TLS capture, exfil timestamp).
5. **Detection segment** — split-screen: attacker action vs. SOC dashboard reacting, matching timestamps; narrate the technique mapping.
6. **IR lifecycle walkthrough** — Preparation → Detection & Analysis → Containment/Eradication/Recovery → Post-Event Activity.
7. **Threat hunting** — hypothesis by me first, then the proactive hunt query against historical logs, before the reactive alert.
8. **Malware analysis** — decompile the PoC APK on camera; walk the scheduled job + C2 code.
9. **Deception/honeypot** — decoy file/credential; show the alert when touched.
10. **Close** — reference which report section each segment maps to.

## Recording

OBS Studio scene with emulator + terminal/log pane + dashboard visible/switchable. Narrate over action; avoid silent stretches.
