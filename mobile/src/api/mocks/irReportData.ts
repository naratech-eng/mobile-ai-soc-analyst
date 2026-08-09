// Representative demo content for the mocked IR-report screen — no live
// POST /reports/ir endpoint exists on the backend (see BUILD-BRIEF.md's
// repo-boundary note). Sections follow FR-004's four-phase IR lifecycle.
// Containment specifics are the actual scripts this project built (ir/),
// not generic incident-report boilerplate.

export type IrReportSection = {
  id: 'preparation' | 'detection' | 'containment' | 'post_event';
  title: string;
  body: string;
};

export type IrReportData = {
  incidentId: string;
  generatedAt: string;
  summary: string;
  sections: IrReportSection[];
};

export const IR_REPORT: IrReportData = {
  incidentId: 'IR-DEMO-0001',
  generatedAt: new Date().toISOString(),
  summary:
    'Suspicious network reconnaissance activity detected from a lab device, correlated to ATT&CK Mobile T1422. Consistent with the self-built PoC kill chain (T1422 -> T1474.003 -> T1603 -> T1521 -> T1646, plus T1541 persistence).',
  sections: [
    {
      id: 'preparation',
      title: 'Preparation',
      body:
        'Isolated lab environment (Genymotion emulator, sandboxed network). Detection pipeline live: mobile collector -> POST /signals -> Pydantic AI triage agent -> ATT&CK Mobile RAG correlation -> alert store. Baseline captured prior to execution: no alerts, collector idle.',
    },
    {
      id: 'detection',
      title: 'Detection & Analysis',
      body:
        'network_activity signal ingested and triaged as suspicious, correlated to T1422 (System Network Configuration Discovery) via the RAG-grounded agent. Rationale cited in the raised alert; timestamp cross-referenced against collector logs for the recorded walkthrough.',
    },
    {
      id: 'containment',
      title: 'Containment, Eradication & Recovery',
      body:
        "Containment executed via ir/containment_kill_job.sh: `adb shell am force-stop` halts the process (stops the T1541 foreground service and prevents the T1603 scheduled job from re-firing), followed by `pm clear` to erase the persisted WorkManager job registration (eradication). Network-layer containment via ir/containment_revoke_network.sh: a per-UID `iptables` DROP rule cuts the T1521/T1646 C2+exfil channel independently of the process kill. Recovery via ir/recovery_restore_network.sh removes the iptables rule once the incident is closed.",
    },
    {
      id: 'post_event',
      title: 'Post-Event Activity',
      body:
        'Evidence retained: alert record (technique id, confidence, rationale), collector logs, and the containment scripts\' own verification output (dumpsys activity services / dumpsys jobscheduler confirming no residual process or scheduled job). Recommended follow-up: promote the honeypot/decoy detection path and extend collector coverage beyond network_activity.',
    },
  ],
};
