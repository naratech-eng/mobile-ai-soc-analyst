import { request } from './client';
import type { Alert, SignalBatchRequest, SignalIn } from './types';

// A 2xx response with an empty alerts array is a valid success — it means
// the signal(s) posted cleanly and triaged as benign, not that the request
// failed. See BUILD-BRIEF.md's "/signals response fields" discovery answer.
export async function postSignals(signals: SignalIn[]): Promise<Alert[]> {
  const body: SignalBatchRequest = { signals };
  return request<Alert[]>('/signals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
