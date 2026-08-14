import { BackgroundTaskStatus } from 'expo-background-task';
import type { TaskManagerTask } from 'expo-task-manager';

import {
  buildScheduledJobSignal,
  ensureScheduledJobRegistered,
  SCHEDULED_TASK_NAME,
  type ScheduledJobDeps,
} from './scheduledJob';

describe('buildScheduledJobSignal', () => {
  it('reports the own task as registered with its interval when present', async () => {
    const registeredTask: TaskManagerTask = {
      taskName: SCHEDULED_TASK_NAME,
      taskType: 'backgroundTask',
      options: { minimumInterval: 15 },
    };
    const deps: ScheduledJobDeps = {
      getStatus: async () => BackgroundTaskStatus.Available,
      getRegisteredTasks: async () => [registeredTask],
      registerTask: async () => {},
    };

    const signal = await buildScheduledJobSignal('device-1', 'android', deps);

    expect(signal.type).toBe('scheduled_job');
    expect(signal.payload).toMatchObject({
      task_name: SCHEDULED_TASK_NAME,
      is_registered: true,
      background_task_status: 'Available',
      minimum_interval_minutes: 15,
    });
  });

  it('reports is_registered: false when the task is not in the registered list', async () => {
    const deps: ScheduledJobDeps = {
      getStatus: async () => BackgroundTaskStatus.Restricted,
      getRegisteredTasks: async () => [],
      registerTask: async () => {},
    };

    const signal = await buildScheduledJobSignal('device-1', 'android', deps);

    expect(signal.payload).toMatchObject({
      is_registered: false,
      background_task_status: 'Restricted',
      minimum_interval_minutes: null,
    });
  });

  it('ignores other apps registered tasks by name', async () => {
    const unrelatedTask: TaskManagerTask = {
      taskName: 'some-other-task',
      taskType: 'backgroundTask',
      options: {},
    };
    const deps: ScheduledJobDeps = {
      getStatus: async () => BackgroundTaskStatus.Available,
      getRegisteredTasks: async () => [unrelatedTask],
      registerTask: async () => {},
    };

    const signal = await buildScheduledJobSignal('device-1', 'android', deps);
    expect(signal.payload.is_registered).toBe(false);
  });
});

describe('ensureScheduledJobRegistered', () => {
  it('swallows registration failures without throwing', async () => {
    const deps = {
      registerTask: async () => {
        throw new Error('unsupported in this environment');
      },
    };

    await expect(ensureScheduledJobRegistered(deps)).resolves.toBeUndefined();
  });

  it('resolves normally on successful registration', async () => {
    let called = false;
    const deps = {
      registerTask: async () => {
        called = true;
      },
    };

    await ensureScheduledJobRegistered(deps);
    expect(called).toBe(true);
  });
});
