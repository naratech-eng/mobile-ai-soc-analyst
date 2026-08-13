import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { runHuntQuery } from '@/src/api/huntService';
import type { HuntResult } from '@/src/api/huntService';
import { formatRelativeTime } from '@/src/lib/formatRelativeTime';

export default function HuntScreen() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<HuntResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await runHuntQuery(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hunt query failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hunt</Text>
      <Text style={styles.subtitle}>
        Type your hunt hypothesis and run it against historical signals.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. poc_recon_job, scheduled_job, network_activity"
          placeholderTextColor="#888"
          onSubmitEditing={run}
          returnKeyType="search"
        />
        <Pressable
          onPress={run}
          disabled={running || !query.trim()}
          style={({ pressed }) => [
            styles.button,
            (pressed || running || !query.trim()) && styles.buttonDisabled,
          ]}>
          <Text style={styles.buttonText}>{running ? '...' : 'Run'}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {running ? <ActivityIndicator style={styles.loading} /> : null}

      {result ? (
        <>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

          {result.matches.length === 0 ? (
            <Text style={styles.noMatches}>No matches for &quot;{result.query}&quot;.</Text>
          ) : (
            <FlatList
              data={result.matches}
              keyExtractor={(item) => item.signal_id}
              renderItem={({ item }) => (
                <View style={styles.matchRow}>
                  <Text style={styles.matchType}>{item.type}</Text>
                  <Text style={styles.matchReason}>{item.matched_reason}</Text>
                  <Text style={styles.matchMeta}>{formatRelativeTime(item.observed_at)}</Text>
                </View>
              )}
            />
          )}
        </>
      ) : null}
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
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  button: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#2f95dc',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    marginTop: 12,
    color: '#c0392b',
  },
  loading: {
    marginTop: 16,
  },
  noMatches: {
    marginTop: 8,
    opacity: 0.7,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
  },
  matchRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  matchType: {
    fontWeight: '600',
  },
  matchReason: {
    fontSize: 14,
    marginTop: 2,
  },
  matchMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
