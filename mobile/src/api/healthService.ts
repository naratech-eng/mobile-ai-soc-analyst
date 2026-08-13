// GET /health is unauthenticated (backend/app/main.py) — deliberately not
// routed through client.ts's requestWithConfig, which requires an API key.
// Going through the authed path would conflate "backend is down" with
// "key is missing," which the preflight gate needs to distinguish.

import { getConfig } from './client';

export async function checkHealth(baseUrl: string = getConfig().baseUrl): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      return false;
    }
    const body = await response.json();
    return body?.status === 'ok';
  } catch {
    return false;
  }
}
