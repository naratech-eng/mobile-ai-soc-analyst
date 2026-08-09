import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getAlerts } from '@/src/api/alertsService';
import { getConfig } from '@/src/api/client';
import { checkHealth } from '@/src/api/healthService';

import { runPreflightChecks, type PreflightResult } from './checks';

export default function PreflightScreen() {
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [running, setRunning] = useState(true);

  const run = useCallback(async () => {
    setRunning(true);
    const next = await runPreflightChecks({ getConfig, checkHealth, getAlerts });
    setResult(next);
    setRunning(false);
    if (next.ready) {
      router.replace('/(tabs)');
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preflight</Text>
      <Text style={styles.subtitle}>Checking backend configuration before starting…</Text>

      {result ? (
        <View style={styles.info}>
          <Text style={styles.infoLine}>Backend: {result.info.backendUrl}</Text>
          <Text style={styles.infoLine}>Correlation input: {result.info.correlationInputNote}</Text>
        </View>
      ) : null}

      <View style={styles.checks}>
        {running ? <ActivityIndicator /> : null}
        {result?.checks.map((check) => (
          <View key={check.id} style={styles.checkRow}>
            <Text style={[styles.checkStatus, check.status === 'fail' && styles.checkFail]}>
              {check.status === 'pass' ? '✓' : '✕'}
            </Text>
            <View style={styles.checkTextBlock}>
              <Text style={styles.checkLabel}>{check.label}</Text>
              {check.detail ? <Text style={styles.checkDetail}>{check.detail}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {!running && result && !result.ready ? (
        <Pressable
          onPress={run}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  info: {
    marginTop: 24,
    gap: 2,
  },
  infoLine: {
    fontSize: 12,
    opacity: 0.6,
  },
  checks: {
    marginTop: 24,
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkStatus: {
    fontWeight: 'bold',
    color: '#27ae60',
  },
  checkFail: {
    color: '#c0392b',
  },
  checkTextBlock: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkDetail: {
    fontSize: 13,
    opacity: 0.7,
  },
  button: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
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
});
