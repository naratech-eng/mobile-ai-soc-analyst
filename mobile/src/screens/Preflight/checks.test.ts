import { runPreflightChecks, type PreflightDeps } from './checks';

const baseDeps = (overrides: Partial<PreflightDeps> = {}): PreflightDeps => ({
  getConfig: () => ({ baseUrl: 'https://backend.test', apiKey: 'test-key' }),
  checkHealth: async () => true,
  getAlerts: async () => [],
  ...overrides,
});

describe('runPreflightChecks', () => {
  it('is ready when every checkable item passes', async () => {
    const result = await runPreflightChecks(baseDeps());
    expect(result.ready).toBe(true);
    expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
    expect(result.info.backendUrl).toBe('https://backend.test');
  });

  it('fails the API key check, and skips the authenticated request, when no key is configured', async () => {
    const getAlerts = jest.fn(async () => []);
    const result = await runPreflightChecks(
      baseDeps({
        getConfig: () => ({ baseUrl: 'https://backend.test', apiKey: undefined }),
        getAlerts,
      })
    );

    expect(result.ready).toBe(false);
    const apiKeyCheck = result.checks.find((c) => c.id === 'apiKey');
    expect(apiKeyCheck?.status).toBe('fail');
    const authCheck = result.checks.find((c) => c.id === 'authenticatedRequest');
    expect(authCheck?.status).toBe('fail');
    expect(getAlerts).not.toHaveBeenCalled();
  });

  it('fails the backend-reachable check when /health is unreachable', async () => {
    const result = await runPreflightChecks(baseDeps({ checkHealth: async () => false }));
    expect(result.ready).toBe(false);
    const healthCheck = result.checks.find((c) => c.id === 'backendReachable');
    expect(healthCheck?.status).toBe('fail');
  });

  it('fails the authenticated-request check with a mapped message when the request rejects', async () => {
    const result = await runPreflightChecks(
      baseDeps({
        getAlerts: async () => {
          throw new Error('boom');
        },
      })
    );
    expect(result.ready).toBe(false);
    const authCheck = result.checks.find((c) => c.id === 'authenticatedRequest');
    expect(authCheck?.status).toBe('fail');
    expect(authCheck?.detail).toBe('Something went wrong.');
  });

  it('always includes the correlation-input note as informational, never gating readiness', async () => {
    const result = await runPreflightChecks(baseDeps());
    expect(result.info.correlationInputNote).toMatch(/can't be verified/i);
  });
});
