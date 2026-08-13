import type { InstalledPackage } from 'device-inventory';

import { buildInstalledAppsSignals, type InstalledAppsDeps } from './installedApps';

const SYSTEM_APP: InstalledPackage = {
  packageName: 'com.android.settings',
  appLabel: 'Settings',
  isSystemApp: true,
  firstInstallTime: 1000,
  requestedPermissions: ['android.permission.WRITE_SETTINGS'],
  grantedPermissions: ['android.permission.WRITE_SETTINGS'],
};

const SIDELOADED_UTILITY: InstalledPackage = {
  packageName: 'com.util.helper',
  appLabel: 'Utility Helper',
  isSystemApp: false,
  firstInstallTime: 1700000000000,
  requestedPermissions: [
    'android.permission.INTERNET',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.FOREGROUND_SERVICE',
  ],
  grantedPermissions: ['android.permission.INTERNET', 'android.permission.RECEIVE_BOOT_COMPLETED'],
};

const BENIGN_USER_APP_NO_PERMISSIONS: InstalledPackage = {
  packageName: 'com.example.notes',
  appLabel: 'Notes',
  isSystemApp: false,
  firstInstallTime: 1690000000000,
  requestedPermissions: [],
  grantedPermissions: [],
};

describe('buildInstalledAppsSignals', () => {
  it('filters out system apps entirely', async () => {
    const deps: InstalledAppsDeps = {
      getInstalledPackages: async () => [SYSTEM_APP, SIDELOADED_UTILITY],
    };

    const { installedAppSignals, permissionSignals } = await buildInstalledAppsSignals(
      'device-1',
      'android',
      deps
    );

    expect(installedAppSignals).toHaveLength(1);
    expect(installedAppSignals[0].payload.package_name).toBe('com.util.helper');
    expect(permissionSignals.every((s) => s.payload.package_name !== 'com.android.settings')).toBe(true);
  });

  it('emits one installed_app signal per non-system package regardless of permissions', async () => {
    const deps: InstalledAppsDeps = {
      getInstalledPackages: async () => [SIDELOADED_UTILITY, BENIGN_USER_APP_NO_PERMISSIONS],
    };

    const { installedAppSignals } = await buildInstalledAppsSignals('device-1', 'android', deps);

    expect(installedAppSignals).toHaveLength(2);
    expect(installedAppSignals.every((s) => s.type === 'installed_app')).toBe(true);
    expect(installedAppSignals.every((s) => s.device_id === 'device-1' && s.platform === 'android')).toBe(
      true
    );
  });

  it('only emits permission signals for packages with at least one granted permission', async () => {
    const deps: InstalledAppsDeps = {
      getInstalledPackages: async () => [SIDELOADED_UTILITY, BENIGN_USER_APP_NO_PERMISSIONS],
    };

    const { permissionSignals } = await buildInstalledAppsSignals('device-1', 'android', deps);

    expect(permissionSignals).toHaveLength(1);
    expect(permissionSignals[0].type).toBe('permission');
    expect(permissionSignals[0].payload).toMatchObject({
      package_name: 'com.util.helper',
      granted_permissions: ['android.permission.INTERNET', 'android.permission.RECEIVE_BOOT_COMPLETED'],
    });
  });

  it('returns empty arrays when there are no user-installed packages', async () => {
    const deps: InstalledAppsDeps = {
      getInstalledPackages: async () => [SYSTEM_APP],
    };

    const { installedAppSignals, permissionSignals } = await buildInstalledAppsSignals(
      'device-1',
      'android',
      deps
    );

    expect(installedAppSignals).toEqual([]);
    expect(permissionSignals).toEqual([]);
  });
});
