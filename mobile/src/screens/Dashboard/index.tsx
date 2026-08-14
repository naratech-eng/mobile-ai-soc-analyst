import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getAlerts } from '@/src/api/alertsService';
import { describeApiError } from '@/src/api/errors';
import type { Alert, SignalIn } from '@/src/api/types';
import { getOrCreateDeviceId } from '@/src/collectors/deviceId';
import { buildInstalledAppsSignals } from '@/src/collectors/installedApps';
import { buildNetworkActivitySignal } from '@/src/collectors/networkActivity';
import { buildScheduledJobSignal, ensureScheduledJobRegistered } from '@/src/collectors/scheduledJob';
import { formatRelativeTime } from '@/src/lib/formatRelativeTime';
import { postSignalsWithQueue } from '@/src/lib/signalQueue';

import { formatAttackId } from './format';

type CollectorState = 'idle' | 'active' | 'error';

// Best-effort: MC-01/MC-02/MC-03 need the native device-inventory module /
// background-task registration that only exist after an EAS dev-client
// rebuild. Until then (or on any other collector hiccup) network_activity
// alone must still post — one collector failing must never block the rest.
async function collectBestEffort(deviceId: string, platform: string): Promise<SignalIn[]> {
  const signals: SignalIn[] = [await buildNetworkActivitySignal(deviceId, platform)];

  try {
    const { installedAppSignals, permissionSignals } = await buildInstalledAppsSignals(
      deviceId,
      platform
    );
    signals.push(...installedAppSignals, ...permissionSignals);
  } catch {
    // Native module unavailable in this build — degrade silently.
  }

  try {
    signals.push(await buildScheduledJobSignal(deviceId, platform));
  } catch {
    // Background-task API unavailable in this build — degrade silently.
  }

  return signals;
}

export default function DashboardScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [collectorState, setCollectorState] = useState<CollectorState>('idle');
  const [collectorError, setCollectorError] = useState<string | null>(null);
  const [collectorNotice, setCollectorNotice] = useState<string | null>(null);
  const [lastSignalPostedAt, setLastSignalPostedAt] = useState<string | null>(null);

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const result = await getAlerts();
      setAlerts(result);
    } catch (err) {
      setAlertsError(describeApiError(err));
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
    refreshAlerts();
    ensureScheduledJobRegistered();
  }, [refreshAlerts]);

  const handlePostSignal = useCallback(async () => {
    if (!deviceId) {
      return;
    }
    setCollectorState('active');
    setCollectorError(null);
    setCollectorNotice(null);
    try {
      const signals = await collectBestEffort(deviceId, Platform.OS);
      const result = await postSignalsWithQueue(signals);

      if (result.status === 'queued') {
        setCollectorNotice(`Offline — buffered ${result.queuedCount} signal(s) locally.`);
      } else {
        if (result.flushedQueuedCount > 0) {
          setCollectorNotice(`Flushed ${result.flushedQueuedCount} previously buffered signal(s).`);
        }
        setLastSignalPostedAt(new Date().toISOString());
        await refreshAlerts();
      }
      setCollectorState('idle');
    } catch (err) {
      setCollectorError(describeApiError(err));
      setCollectorState('error');
    }
  }, [deviceId, refreshAlerts]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statusBlock}>
        <Text style={styles.statusLine}>Device: {deviceId ?? 'resolving…'}</Text>
        <Text style={styles.statusLine}>
          Collector: {collectorState}
          {lastSignalPostedAt ? ` · last signal ${formatRelativeTime(lastSignalPostedAt)}` : ''}
        </Text>
        {collectorError ? <Text style={styles.errorText}>{collectorError}</Text> : null}
        {collectorNotice ? <Text style={styles.statusLine}>{collectorNotice}</Text> : null}
        <Pressable
          onPress={handlePostSignal}
          disabled={collectorState === 'active' || !deviceId}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>
            {collectorState === 'active' ? 'Collecting…' : 'Collect & Post Signals'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <View style={styles.alertsSection}>
        {alertsLoading ? (
          <ActivityIndicator />
        ) : alertsError ? (
          <Text style={styles.errorText}>{alertsError}</Text>
        ) : alerts.length === 0 ? (
          <Text style={styles.body}>No alerts yet.</Text>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.alert_id}
            renderItem={({ item }) => (
              <View style={styles.alertRow}>
                <Text style={styles.alertSeverity}>{item.severity}</Text>
                <Text style={styles.alertMeta}>{formatAttackId(item.attack_id)}</Text>
                <Text style={styles.alertMeta}>{formatRelativeTime(item.raised_at)}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBlock: {
    marginTop: 16,
    gap: 4,
  },
  statusLine: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
  },
  button: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#2f95dc',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
  },
  alertsSection: {
    flex: 1,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  alertSeverity: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alertMeta: {
    fontSize: 13,
    opacity: 0.7,
  },
});
