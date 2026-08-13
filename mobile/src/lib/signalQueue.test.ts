import { ApiAuthError, ApiNetworkError } from '../api/errors';
import type { Alert, SignalIn } from '../api/types';
import { getQueuedSignalCount, postSignalsWithQueue, type SignalQueueDeps } from './signalQueue';

function fakeStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  const storage = {
    async getItem(key: string) {
      return store[key] ?? null;
    },
    async setItem(key: string, value: string) {
      store[key] = value;
    },
  };
  return storage;
}

const SIGNAL: SignalIn = {
  device_id: 'device-1',
  platform: 'android',
  type: 'network_activity',
  payload: {},
  observed_at: '2026-08-13T00:00:00.000Z',
};

const NO_ALERTS: Alert[] = [];

describe('postSignalsWithQueue', () => {
  it('posts directly and reports nothing flushed when the queue was empty', async () => {
    const storage = fakeStorage();
    const deps: SignalQueueDeps = { storage, post: async () => NO_ALERTS };

    const result = await postSignalsWithQueue([SIGNAL], deps);

    expect(result).toEqual({ status: 'posted', alerts: NO_ALERTS, flushedQueuedCount: 0 });
    expect(await getQueuedSignalCount({ storage })).toBe(0);
  });

  it('buffers the batch locally on a network error instead of throwing', async () => {
    const storage = fakeStorage();
    const deps: SignalQueueDeps = {
      storage,
      post: async () => {
        throw new ApiNetworkError(new Error('offline'));
      },
    };

    const result = await postSignalsWithQueue([SIGNAL], deps);

    expect(result).toEqual({ status: 'queued', queuedCount: 1 });
    expect(await getQueuedSignalCount({ storage })).toBe(1);
  });

  it('prepends previously queued signals to the next post attempt and clears the queue on success', async () => {
    const storage = fakeStorage({
      'soc-analyst.signal-queue': JSON.stringify([SIGNAL]),
    });
    let receivedBatch: SignalIn[] | null = null;
    const deps: SignalQueueDeps = {
      storage,
      post: async (signals) => {
        receivedBatch = signals;
        return NO_ALERTS;
      },
    };

    const result = await postSignalsWithQueue([SIGNAL], deps);

    expect(receivedBatch).toHaveLength(2);
    expect(result).toEqual({ status: 'posted', alerts: NO_ALERTS, flushedQueuedCount: 1 });
    expect(await getQueuedSignalCount({ storage })).toBe(0);
  });

  it('re-throws non-network errors (e.g. auth) without queuing', async () => {
    const storage = fakeStorage();
    const deps: SignalQueueDeps = {
      storage,
      post: async () => {
        throw new ApiAuthError();
      },
    };

    await expect(postSignalsWithQueue([SIGNAL], deps)).rejects.toBeInstanceOf(ApiAuthError);
    expect(await getQueuedSignalCount({ storage })).toBe(0);
  });
});
