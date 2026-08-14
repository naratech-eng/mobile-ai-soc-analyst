// POST /hunt (TH-01): the analyst supplies the query — this just executes
// it against the backend's persisted signal history. See BUILD-BRIEF.md's
// repo-boundary note; this replaced the mock now that the endpoint exists.

import { request } from './client';
import type { HuntResult } from './types';

export async function runHuntQuery(query: string): Promise<HuntResult> {
  return request<HuntResult>('/hunt', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export type { HuntMatch, HuntResult } from './types';
