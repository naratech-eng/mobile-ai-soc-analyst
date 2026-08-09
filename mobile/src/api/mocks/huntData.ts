// Representative demo content for the mocked Hunt screen — no live /hunt
// endpoint exists on the backend (see BUILD-BRIEF.md's repo-boundary note).
// Shaped like the real Signal/Event data model so it reads as plausible
// output of a real hunt query, not placeholder text.

export type HuntMatch = {
  signal_id: string;
  device_id: string;
  type: string;
  matched_reason: string;
  observed_at: string;
};

export type HuntResult = {
  query: string;
  matches: HuntMatch[];
};

const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();

export const HUNT_RESULT: HuntResult = {
  query: 'type:network_activity AND payload.connection_type:WIFI within 24h',
  matches: [
    {
      signal_id: 'a3f6e1c2-7b9d-4e3a-9f21-6c1d4e8b2a90',
      device_id: 'demo-device-01',
      type: 'network_activity',
      matched_reason: 'Correlated to T1422 (System Network Configuration Discovery)',
      observed_at: minutesAgo(6),
    },
    {
      signal_id: '9d2c4b7a-1e5f-48a2-b3c6-2f7a9e1d5c40',
      device_id: 'demo-device-01',
      type: 'network_activity',
      matched_reason: 'Repeated recon interval matches T1603 scheduled-job cadence',
      observed_at: minutesAgo(21),
    },
    {
      signal_id: '5e1a8f3d-6c2b-4a97-8d14-3b6e2c9f7a15',
      device_id: 'demo-device-01',
      type: 'network_activity',
      matched_reason: 'VPN connection type flagged for manual review',
      observed_at: minutesAgo(58),
    },
  ],
};
