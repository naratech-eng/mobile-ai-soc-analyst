// POST /reports/ir (FR-004): generates a real report from the most recent
// alert. See BUILD-BRIEF.md's repo-boundary note; this replaced the mock
// now that the endpoint exists. Keeps the screen's existing camelCase shape
// — the backend contract is snake_case, so this is the seam that adapts it.

import { request } from './client';
import type { IrReportApi } from './types';

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
  attackId: string | null;
  severity: string;
  raisedAt: string;
};

export async function getIrReport(alertId?: string): Promise<IrReportData> {
  const api = await request<IrReportApi>('/reports/ir', {
    method: 'POST',
    body: JSON.stringify({ alert_id: alertId ?? null }),
  });

  return {
    incidentId: api.incident_id,
    generatedAt: api.generated_at,
    summary: api.summary,
    sections: api.sections.map((s) => ({
      id: s.id as IrReportSection['id'],
      title: s.title,
      body: s.body,
    })),
    attackId: api.attack_id,
    severity: api.severity,
    raisedAt: api.raised_at,
  };
}
