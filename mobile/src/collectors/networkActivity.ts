// Builds a `network_activity` SignalIn from the device's current network
// state. Deps are injectable (default to the real expo-network calls) so
// this is testable without mocking a native module — see BUILD-BRIEF.md's
// "React Native Screen Architecture" discovery answer / the same pattern
// src/api/client.ts uses for its config.

import * as Network from 'expo-network';

import type { SignalIn } from '../api/types';

export type NetworkActivityDeps = {
  getNetworkState: () => Promise<Network.NetworkState>;
  getIpAddress: () => Promise<string>;
};

const defaultDeps: NetworkActivityDeps = {
  getNetworkState: Network.getNetworkStateAsync,
  getIpAddress: Network.getIpAddressAsync,
};

// expo-network returns the sentinel "0.0.0.0" (not a thrown error, per its
// own docs) when the IP address couldn't be retrieved.
const UNAVAILABLE_IP = '0.0.0.0';

export async function buildNetworkActivitySignal(
  deviceId: string,
  platform: string,
  deps: NetworkActivityDeps = defaultDeps
): Promise<SignalIn> {
  const state = await deps.getNetworkState();

  // Best-effort — IP lookup failing must never block the rest of the signal.
  let ipAddress: string | null = null;
  try {
    const ip = await deps.getIpAddress();
    ipAddress = ip && ip !== UNAVAILABLE_IP ? ip : null;
  } catch {
    ipAddress = null;
  }

  return {
    device_id: deviceId,
    platform,
    type: 'network_activity',
    payload: {
      connection_type: state.type ?? 'UNKNOWN',
      is_connected: state.isConnected ?? false,
      is_internet_reachable: state.isInternetReachable ?? false,
      is_vpn_active: state.type === Network.NetworkStateType.VPN,
      ip_address: ipAddress,
    },
    observed_at: new Date().toISOString(),
  };
}
