// MC-03, self-reported scope (per repo decision — see mobile/README.md):
// Android does not let a third-party app enumerate other apps'
// AlarmManager/WorkManager jobs without root or an accessibility service,
// so this collector reports the SOC app's own scheduled background work
// only. `adb shell dumpsys jobscheduler` stays the manual evidence path for
// the PoC app's own scheduled job in the video walkthrough.
//
// defineTask must run at module scope (not inside a component/function) per
// expo-task-manager's docs, so it happens here at import time. Deps are
// injectable for the read path, same pattern as the other collectors.

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import type { SignalIn } from '../api/types';

export const SCHEDULED_TASK_NAME = 'soc-analyst-resync';

TaskManager.defineTask(SCHEDULED_TASK_NAME, async () => {
  return BackgroundTask.BackgroundTaskResult.Success;
});

export type ScheduledJobDeps = {
  getStatus: () => Promise<BackgroundTask.BackgroundTaskStatus>;
  getRegisteredTasks: () => Promise<TaskManager.TaskManagerTask[]>;
  registerTask: () => Promise<void>;
};

const defaultDeps: ScheduledJobDeps = {
  getStatus: () => BackgroundTask.getStatusAsync(),
  getRegisteredTasks: () => TaskManager.getRegisteredTasksAsync(),
  registerTask: () =>
    BackgroundTask.registerTaskAsync(SCHEDULED_TASK_NAME, { minimumInterval: 15 }),
};

// Best-effort — registration failing (e.g. iOS simulator, unsupported
// environment) must never block the rest of the collection loop.
export async function ensureScheduledJobRegistered(
  deps: Pick<ScheduledJobDeps, 'registerTask'> = defaultDeps
): Promise<void> {
  try {
    await deps.registerTask();
  } catch {
    // Swallowed intentionally — buildScheduledJobSignal still reports
    // is_registered: false in this case, which is itself useful signal.
  }
}

export async function buildScheduledJobSignal(
  deviceId: string,
  platform: string,
  deps: ScheduledJobDeps = defaultDeps
): Promise<SignalIn> {
  const [status, registeredTasks] = await Promise.all([
    deps.getStatus(),
    deps.getRegisteredTasks(),
  ]);

  const ownTask = registeredTasks.find((task) => task.taskName === SCHEDULED_TASK_NAME);

  return {
    device_id: deviceId,
    platform,
    type: 'scheduled_job',
    payload: {
      task_name: SCHEDULED_TASK_NAME,
      is_registered: ownTask != null,
      background_task_status: BackgroundTask.BackgroundTaskStatus[status] ?? 'UNKNOWN',
      minimum_interval_minutes:
        (ownTask?.options as { minimumInterval?: number } | undefined)?.minimumInterval ?? null,
    },
    observed_at: new Date().toISOString(),
  };
}
