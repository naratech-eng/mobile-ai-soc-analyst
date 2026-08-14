"""Static description of this project's real containment/recovery scripts
(ir/*.sh at repo root — not shipped in the backend image, so summarized
here) so the report-writer agent grounds the Containment/Eradication/
Recovery section in actual lab actions instead of generic IR boilerplate."""

CONTAINMENT_PLAYBOOK = """\
containment_kill_job.sh: `adb shell am force-stop <pkg>` halts the running \
process immediately — stops the foreground-persistence service (T1541) and \
moves the app to Android's "stopped" state, which blocks JobScheduler/\
WorkManager/alarms from firing until the app is relaunched (halts the \
T1603 scheduled job without touching app data). Followed by `pm clear` as \
the eradication step: wipes the app's persisted WorkManager job \
registration so the job can't just re-arm on next launch.

containment_revoke_network.sh: resolves the app's UID via \
`dumpsys package` and adds a per-UID `iptables -A OUTPUT ... -j DROP` rule \
-- cuts the C2 channel (T1521) and exfil (T1646) at the network layer, \
independently of the process kill, so both containment actions can be \
demonstrated and evidenced separately.

recovery_restore_network.sh: removes the iptables DROP rule for the app's \
UID once the incident is closed, restoring pre-incident network state."""
