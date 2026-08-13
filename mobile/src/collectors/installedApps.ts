// Normalizes the device-inventory native module's installed-package dump
// (mobile/modules/device-inventory) into permission (MC-01) and
// installed_app (MC-02) SignalIn batches. Scoped to non-system
// (user-installed) packages only — system apps aren't attacker-controlled
// in this threat model and would otherwise flood the batch with hundreds
// of irrelevant rows. Deps are injectable, same pattern as
// networkActivity.ts, so this is testable without the native module.

import type { InstalledPackage } from 'device-inventory';
import DeviceInventory from 'device-inventory';

import type { SignalIn } from '../api/types';

export type InstalledAppsDeps = {
  getInstalledPackages: () => Promise<InstalledPackage[]>;
};

const defaultDeps: InstalledAppsDeps = {
  getInstalledPackages: () => DeviceInventory.getInstalledPackagesAsync(),
};

export type InstalledAppsSignals = {
  installedAppSignals: SignalIn[];
  permissionSignals: SignalIn[];
};

export async function buildInstalledAppsSignals(
  deviceId: string,
  platform: string,
  deps: InstalledAppsDeps = defaultDeps
): Promise<InstalledAppsSignals> {
  const packages = await deps.getInstalledPackages();
  const observedAt = new Date().toISOString();
  const userPackages = packages.filter((pkg) => !pkg.isSystemApp);

  const installedAppSignals: SignalIn[] = userPackages.map((pkg) => ({
    device_id: deviceId,
    platform,
    type: 'installed_app',
    payload: {
      package_name: pkg.packageName,
      app_label: pkg.appLabel,
      first_install_time: pkg.firstInstallTime,
    },
    observed_at: observedAt,
  }));

  const permissionSignals: SignalIn[] = userPackages
    .filter((pkg) => pkg.grantedPermissions.length > 0)
    .map((pkg) => ({
      device_id: deviceId,
      platform,
      type: 'permission',
      payload: {
        package_name: pkg.packageName,
        requested_permissions: pkg.requestedPermissions,
        granted_permissions: pkg.grantedPermissions,
      },
      observed_at: observedAt,
    }));

  return { installedAppSignals, permissionSignals };
}
