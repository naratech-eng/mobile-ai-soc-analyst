// The only module that knows about the backend base URL, the auth header,
// and how to classify a failed request. signalsService/alertsService call
// `request()` and never touch fetch/auth directly — see BUILD-BRIEF.md's
// "React Native Screen Architecture" discovery answer for why.
//
// Config is read from process.env at the `request()` boundary only —
// `requestWithConfig()` takes it explicitly so tests can exercise the real
// request/error-classification logic without depending on process.env
// (Expo's babel preset inlines EXPO_PUBLIC_* vars at compile time, so
// mutating process.env at test runtime has no effect on already-compiled
// reads of it).

import { ApiAuthError, ApiConfigError, ApiHttpError, ApiNetworkError } from './errors';

export type ClientConfig = {
  baseUrl: string;
  apiKey: string | undefined;
};

// Low-friction default so a fresh checkout can hit the known-healthy dev
// backend without extra setup; the API key has no default — a real secret
// should never be hardcoded.
const DEFAULT_BACKEND_URL =
  'https://ca-socanalyst-dev.mangofield-d09bdeea.canadacentral.azurecontainerapps.io';

export function getConfig(): ClientConfig {
  return {
    baseUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL,
    apiKey: process.env.EXPO_PUBLIC_BACKEND_API_KEY,
  };
}

export async function requestWithConfig<T>(
  config: ClientConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  if (!config.apiKey) {
    throw new ApiConfigError(
      'EXPO_PUBLIC_BACKEND_API_KEY is not set — copy mobile/.env.example to mobile/.env and fill it in.'
    );
  }

  const url = `${config.baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    ...init?.headers,
  };

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (cause) {
    throw new ApiNetworkError(cause);
  }

  if (response.status === 401) {
    throw new ApiAuthError();
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiHttpError(response.status, body || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestWithConfig(getConfig(), path, init);
}
