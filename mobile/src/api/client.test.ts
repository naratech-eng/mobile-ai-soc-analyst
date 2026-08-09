import { requestWithConfig } from './client';
import { ApiAuthError, ApiConfigError, ApiHttpError, ApiNetworkError } from './errors';

const TEST_CONFIG = { baseUrl: 'https://backend.test', apiKey: 'test-key' };

function mockFetchOnce(response: Partial<Response> & { ok: boolean; status: number }) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    text: async () => '',
    json: async () => ({}),
    ...response,
  }) as unknown as typeof fetch;
}

describe('requestWithConfig', () => {
  it('throws ApiAuthError on a 401 response', async () => {
    mockFetchOnce({ ok: false, status: 401 });
    await expect(requestWithConfig(TEST_CONFIG, '/alerts')).rejects.toBeInstanceOf(ApiAuthError);
  });

  it('throws ApiHttpError (carrying the status) on a non-401 non-2xx response', async () => {
    mockFetchOnce({ ok: false, status: 500, text: async () => 'boom' });
    await expect(requestWithConfig(TEST_CONFIG, '/alerts')).rejects.toBeInstanceOf(ApiHttpError);
    mockFetchOnce({ ok: false, status: 500, text: async () => 'boom' });
    await expect(requestWithConfig(TEST_CONFIG, '/alerts')).rejects.toMatchObject({ status: 500 });
  });

  it('throws ApiNetworkError when fetch itself rejects', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(requestWithConfig(TEST_CONFIG, '/alerts')).rejects.toBeInstanceOf(ApiNetworkError);
  });

  it('throws ApiConfigError when no API key is configured, without calling fetch', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await expect(
      requestWithConfig({ baseUrl: 'https://backend.test', apiKey: undefined }, '/alerts')
    ).rejects.toBeInstanceOf(ApiConfigError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resolves with the parsed JSON body on a 2xx response', async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => [{ alert_id: 'a1' }] });
    await expect(requestWithConfig(TEST_CONFIG, '/alerts')).resolves.toEqual([{ alert_id: 'a1' }]);
  });
});
