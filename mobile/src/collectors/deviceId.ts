// Generates and persists a stable device identifier. Not a secret — just an
// identifier the backend upserts a Device row for on first sight
// (backend/app/store/repository.py's get_or_create_device) — so plain
// AsyncStorage is the right amount of engineering, no encrypted keychain
// needed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'soc-analyst.device-id';

export type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export async function getOrCreateDeviceId(
  storage: StorageLike = AsyncStorage,
  generateId: () => string = Crypto.randomUUID
): Promise<string> {
  const existing = await storage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = generateId();
  await storage.setItem(STORAGE_KEY, generated);
  return generated;
}
