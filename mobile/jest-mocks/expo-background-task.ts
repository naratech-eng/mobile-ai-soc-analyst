// Jest-only stand-in — see mobile/package.json's jest.moduleNameMapper.
// Same reason as jest-mocks/expo-task-manager.ts: requireNativeModule at
// import time throws under jest with no shipped mock of its own.
export enum BackgroundTaskStatus {
  Restricted = 1,
  Available = 2,
}

export enum BackgroundTaskResult {
  Success = 1,
  Failed = 2,
}

export type BackgroundTaskOptions = {
  minimumInterval?: number;
};

export async function getStatusAsync(): Promise<BackgroundTaskStatus> {
  return BackgroundTaskStatus.Available;
}

export async function registerTaskAsync(): Promise<void> {}

export async function unregisterTaskAsync(): Promise<void> {}
