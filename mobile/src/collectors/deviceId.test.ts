import { getOrCreateDeviceId, type StorageLike } from './deviceId';

function fakeStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  let setItemCalls = 0;
  const storage: StorageLike = {
    async getItem(key) {
      return store[key] ?? null;
    },
    async setItem(key, value) {
      store[key] = value;
      setItemCalls++;
    },
  };
  return { storage, getSetItemCalls: () => setItemCalls };
}

const fakeGenerateId = () => 'generated-id';

describe('getOrCreateDeviceId', () => {
  it('generates and persists a new id when none is stored', async () => {
    const { storage, getSetItemCalls } = fakeStorage();
    const id = await getOrCreateDeviceId(storage, fakeGenerateId);
    expect(id).toBe('generated-id');
    expect(getSetItemCalls()).toBe(1);
  });

  it('returns the existing id without writing again', async () => {
    const { storage, getSetItemCalls } = fakeStorage({ 'soc-analyst.device-id': 'existing-id' });
    const id = await getOrCreateDeviceId(storage, fakeGenerateId);
    expect(id).toBe('existing-id');
    expect(getSetItemCalls()).toBe(0);
  });

  it('is stable across repeated calls against the same storage', async () => {
    const { storage, getSetItemCalls } = fakeStorage();
    const first = await getOrCreateDeviceId(storage, fakeGenerateId);
    const second = await getOrCreateDeviceId(storage, fakeGenerateId);
    expect(second).toBe(first);
    expect(getSetItemCalls()).toBe(1);
  });
});
