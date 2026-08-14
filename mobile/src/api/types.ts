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

export type HuntMatch = {
  signal_id: string;
  device_id: string;
  type: SignalType;
  matched_reason: string;
  observed_at: string;
};

export type HuntResult = {
  query: string;
  matches: HuntMatch[];
};

export type IrReportSectionApi = {
  id: string;
  title: string;
  body: string;
};

export type IrReportApi = {
  incident_id: string;
  generated_at: string;
  summary: string;
  sections: IrReportSectionApi[];
  attack_id: string | null;
  severity: string;
  raised_at: string;
};
