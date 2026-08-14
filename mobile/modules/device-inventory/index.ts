// Local Expo module (android-only, see expo-module.config.json). Wraps
// PackageManager.getInstalledPackages(GET_PERMISSIONS) — the standard
// approach mobile security/AV apps use to inventory permissions across
// packages, gated by the QUERY_ALL_PACKAGES manifest permission declared
// in android/src/main/AndroidManifest.xml. Not eligible for Play Store
// distribution under that permission's policy, which is fine: this app is
// sideloaded via EAS dev-client for the lab, never published.

import { requireNativeModule } from 'expo-modules-core';

export type InstalledPackage = {
  packageName: string;
  appLabel: string;
  isSystemApp: boolean;
  firstInstallTime: number;
  requestedPermissions: string[];
  grantedPermissions: string[];
};

type DeviceInventoryModule = {
  getInstalledPackagesAsync(): Promise<InstalledPackage[]>;
};

export default requireNativeModule<DeviceInventoryModule>('DeviceInventory');
