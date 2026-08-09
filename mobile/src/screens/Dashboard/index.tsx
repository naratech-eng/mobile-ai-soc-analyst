import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getAlerts } from '@/src/api/alertsService';
import { postSignals } from '@/src/api/signalsService';
import type { Alert } from '@/src/api/types';
import { getOrCreateDeviceId } from '@/src/collectors/deviceId';
import { buildNetworkActivitySignal } from '@/src/collectors/networkActivity';

import { describeApiError, formatAttackId, formatRelativeTime } from './format';

type CollectorState = 'idle' | 'active' | 'error';

export default function DashboardScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [collectorState, setCollectorState] = useState<CollectorState>('idle');
  const [collectorError, setCollectorError] = useState<string | null>(null);
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
  }, [refreshAlerts]);

  const handlePostSignal = useCallback(async () => {
    if (!deviceId) {
      return;
    }
    setCollectorState('active');
    setCollectorError(null);
    try {
      const signal = await buildNetworkActivitySignal(deviceId, Platform.OS);
      await postSignals([signal]);
      setLastSignalPostedAt(new Date().toISOString());
      setCollectorState('idle');
      await refreshAlerts();
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
        <Pressable
          onPress={handlePostSignal}
          disabled={collectorState === 'active' || !deviceId}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>
            {collectorState === 'active' ? 'Posting…' : 'Post Signal'}
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
