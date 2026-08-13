// Jest-only stand-in — see mobile/package.json's jest.moduleNameMapper.
// expo-task-manager's real entrypoint calls requireNativeModule at import
// time (and registers a headless task via AppRegistry), which throws under
// jest-expo since there's no native binding in a Node test environment and
// the package ships no jest mock of its own.
export type TaskManagerTask = {
  taskName: string;
  taskType: string;
  options: Record<string, unknown>;
};

export function defineTask(): void {}

export function isTaskDefined(): boolean {
  return false;
}

export async function isTaskRegisteredAsync(): Promise<boolean> {
  return false;
}

export async function getRegisteredTasksAsync(): Promise<TaskManagerTask[]> {
  return [];
}

export async function unregisterTaskAsync(): Promise<void> {}
