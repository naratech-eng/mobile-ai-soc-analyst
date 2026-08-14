// MC-05: buffer + retry on connectivity loss. Wraps signalsService.postSignals
// so a collection cycle that can't reach the backend doesn't lose signals —
// they're persisted locally and prepended to the next successful post.
//
// Only ApiNetworkError triggers buffering. Auth/config/HTTP errors (RB-3)
// are real failures the analyst needs to see immediately, not a
// connectivity blip worth silently retrying later — see mobile/src/api/errors.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { postSignals } from '../api/signalsService';
import { ApiNetworkError } from '../api/errors';
import type { Alert, SignalIn } from '../api/types';

const QUEUE_STORAGE_KEY = 'soc-analyst.signal-queue';

export type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type SignalQueueDeps = {
  storage: StorageLike;
  post: (signals: SignalIn[]) => Promise<Alert[]>;
};

const defaultDeps: SignalQueueDeps = {
  storage: AsyncStorage,
  post: postSignals,
};

async function readQueue(storage: StorageLike): Promise<SignalIn[]> {
  const raw = await storage.getItem(QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(storage: StorageLike, signals: SignalIn[]): Promise<void> {
  await storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(signals));
}

export type QueuedPostResult =
  | { status: 'posted'; alerts: Alert[]; flushedQueuedCount: number }
  | { status: 'queued'; queuedCount: number };

export async function postSignalsWithQueue(
  signals: SignalIn[],
  deps: SignalQueueDeps = defaultDeps
): Promise<QueuedPostResult> {
  const previouslyQueued = await readQueue(deps.storage);
  const batch = [...previouslyQueued, ...signals];

  try {
    const alerts = await deps.post(batch);
    await writeQueue(deps.storage, []);
    return { status: 'posted', alerts, flushedQueuedCount: previouslyQueued.length };
  } catch (err) {
    if (err instanceof ApiNetworkError) {
      await writeQueue(deps.storage, batch);
      return { status: 'queued', queuedCount: batch.length };
    }
    throw err;
  }
}

export async function getQueuedSignalCount(
  deps: Pick<SignalQueueDeps, 'storage'> = defaultDeps
): Promise<number> {
  return (await readQueue(deps.storage)).length;
}
