import { describeApiError } from '@/src/api/errors';
import type { ClientConfig } from '@/src/api/client';
import type { Alert } from '@/src/api/types';

export type PreflightCheckStatus = 'pass' | 'fail';

export type PreflightCheckResult = {
  id: 'apiKey' | 'backendReachable' | 'authenticatedRequest';
  label: string;
  status: PreflightCheckStatus;
  detail?: string;
};

export type PreflightInfo = {
  backendUrl: string;
  correlationInputNote: string;
};

export type PreflightResult = {
  ready: boolean;
  checks: PreflightCheckResult[];
  info: PreflightInfo;
};

export type PreflightDeps = {
  getConfig: () => ClientConfig;
  checkHealth: (baseUrl: string) => Promise<boolean>;
  getAlerts: () => Promise<Alert[]>;
};

const CORRELATION_INPUT_NOTE =
  "Can't be verified from this app — the backend exposes no endpoint for RAG/ATT&CK seed status.";

export async function runPreflightChecks(deps: PreflightDeps): Promise<PreflightResult> {
  const config = deps.getConfig();
  const checks: PreflightCheckResult[] = [];

  const hasApiKey = Boolean(config.apiKey);
  checks.push({
    id: 'apiKey',
    label: 'API key configured',
    status: hasApiKey ? 'pass' : 'fail',
    detail: hasApiKey ? undefined : 'Copy mobile/.env.example to mobile/.env and fill it in.',
  });

  const healthy = await deps.checkHealth(config.baseUrl);
  checks.push({
    id: 'backendReachable',
    label: 'Backend reachable',
    status: healthy ? 'pass' : 'fail',
    detail: healthy ? undefined : `Could not reach ${config.baseUrl}/health.`,
  });

  // Only attempt an authenticated call if there's a key to try — otherwise
  // this is guaranteed to fail for a reason already reported above.
  let authOk = false;
  let authDetail: string | undefined;
  if (hasApiKey) {
    try {
      await deps.getAlerts();
      authOk = true;
    } catch (err) {
      authDetail = describeApiError(err);
    }
  } else {
    authDetail = 'Skipped — no API key configured.';
  }
  checks.push({
    id: 'authenticatedRequest',
    label: 'Authenticated request succeeds',
    status: authOk ? 'pass' : 'fail',
    detail: authDetail,
  });

  return {
    ready: checks.every((check) => check.status === 'pass'),
    checks,
    info: {
      backendUrl: config.baseUrl,
      correlationInputNote: CORRELATION_INPUT_NOTE,
    },
  };
}
