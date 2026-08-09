import { NetworkStateType } from 'expo-network';

import { buildNetworkActivitySignal, type NetworkActivityDeps } from './networkActivity';

const CONNECTED_WIFI = {
  type: NetworkStateType.WIFI,
  isConnected: true,
  isInternetReachable: true,
};

describe('buildNetworkActivitySignal', () => {
  it('builds a well-formed network_activity signal', async () => {
    const deps: NetworkActivityDeps = {
      getNetworkState: async () => CONNECTED_WIFI,
      getIpAddress: async () => '192.168.1.42',
    };

    const signal = await buildNetworkActivitySignal('device-1', 'android', deps);

    expect(signal.device_id).toBe('device-1');
    expect(signal.platform).toBe('android');
    expect(signal.type).toBe('network_activity');
    expect(signal.payload).toMatchObject({
      connection_type: 'WIFI',
      is_connected: true,
      is_internet_reachable: true,
      is_vpn_active: false,
      ip_address: '192.168.1.42',
    });
    expect(typeof signal.observed_at).toBe('string');
  });

  it('derives is_vpn_active from the connection type', async () => {
    const deps: NetworkActivityDeps = {
      getNetworkState: async () => ({ type: NetworkStateType.VPN, isConnected: true, isInternetReachable: true }),
      getIpAddress: async () => '10.0.0.5',
    };

    const signal = await buildNetworkActivitySignal('device-1', 'android', deps);
    expect(signal.payload.is_vpn_active).toBe(true);
  });

  it('degrades gracefully when the IP lookup returns the unavailable sentinel', async () => {
    const deps: NetworkActivityDeps = {
      getNetworkState: async () => CONNECTED_WIFI,
      getIpAddress: async () => '0.0.0.0',
    };

    const signal = await buildNetworkActivitySignal('device-1', 'android', deps);
    expect(signal.payload.ip_address).toBeNull();
    expect(signal.payload.connection_type).toBe('WIFI');
  });

  it('degrades gracefully when the IP lookup throws', async () => {
    const deps: NetworkActivityDeps = {
      getNetworkState: async () => CONNECTED_WIFI,
      getIpAddress: async () => {
        throw new Error('unavailable');
      },
    };

    const signal = await buildNetworkActivitySignal('device-1', 'android', deps);
    expect(signal.payload.ip_address).toBeNull();
    expect(signal.payload.is_connected).toBe(true);
  });

  it('falls back sensibly when network state fields are missing', async () => {
    const deps: NetworkActivityDeps = {
      getNetworkState: async () => ({}),
      getIpAddress: async () => '0.0.0.0',
    };

    const signal = await buildNetworkActivitySignal('device-1', 'android', deps);
    expect(signal.payload).toMatchObject({
      connection_type: 'UNKNOWN',
      is_connected: false,
      is_internet_reachable: false,
      is_vpn_active: false,
    });
  });
});
