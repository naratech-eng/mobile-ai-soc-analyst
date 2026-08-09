// Mocked — see BUILD-BRIEF.md's repo-boundary note: POST /reports/ir
// doesn't exist on the backend. This file IS the mock, full stop (RB-6: no
// runtime live/mock flag). When the real endpoint ships, this body
// changes to call request('/reports/ir', ...) — screens don't change.

import { IR_REPORT, type IrReportData } from './mocks/irReportData';

const MOCK_DELAY_MS = 300;

export async function getIrReport(): Promise<IrReportData> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return IR_REPORT;
}

export type { IrReportData, IrReportSection } from './mocks/irReportData';
