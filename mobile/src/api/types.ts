// Mirrors backend/app/models/schemas.py — keep in sync with the backend contract.

export type SignalType = 'permission' | 'installed_app' | 'scheduled_job' | 'network_activity';

export type SignalIn = {
  device_id: string;
  platform: string;
  type: SignalType;
  payload: Record<string, unknown>;
  observed_at?: string;
};

export type SignalBatchRequest = {
  signals: SignalIn[];
};

export type Alert = {
  alert_id: string;
  event_id: string;
  attack_id: string | null;
  severity: string;
  raised_at: string;
};
