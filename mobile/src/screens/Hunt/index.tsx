import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { runHuntQuery } from '@/src/api/huntService';
import type { HuntResult } from '@/src/api/huntService';
import { formatRelativeTime } from '@/src/lib/formatRelativeTime';

export default function HuntScreen() {
  const [result, setResult] = useState<HuntResult | null>(null);

  useEffect(() => {
    runHuntQuery().then(setResult);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hunt</Text>

      {!result ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <>
          <Text style={styles.queryLabel}>Query</Text>
          <Text style={styles.query}>{result.query}</Text>

          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

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
        </>
      )}
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
  loading: {
    marginTop: 32,
  },
  queryLabel: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  query: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
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
