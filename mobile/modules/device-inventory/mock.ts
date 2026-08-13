// Jest-only stand-in — see mobile/package.json's jest.moduleNameMapper.
// requireNativeModule('DeviceInventory') throws under jest-expo when no
// native module is registered under that name (there's nothing to link in
// a Node test environment); collectors that need real data supply their
// own deps in tests, so this only needs to satisfy the import.
import type { InstalledPackage } from './index';

const DeviceInventoryMock = {
  getInstalledPackagesAsync: async (): Promise<InstalledPackage[]> => [],
};

export default DeviceInventoryMock;
export type { InstalledPackage } from './index';
