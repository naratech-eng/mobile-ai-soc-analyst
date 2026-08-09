// Mocked — see BUILD-BRIEF.md's repo-boundary note: POST /hunt doesn't
// exist on the backend. This file IS the mock, full stop (RB-6: no
// runtime live/mock flag). When the real endpoint ships, this body
// changes to call request('/hunt', ...) — screens don't change.

import { HUNT_RESULT, type HuntResult } from './mocks/huntData';

const MOCK_DELAY_MS = 300;

export async function runHuntQuery(): Promise<HuntResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return HUNT_RESULT;
}

export type { HuntMatch, HuntResult } from './mocks/huntData';
