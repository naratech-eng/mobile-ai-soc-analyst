import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getIrReport } from '@/src/api/irReportService';
import type { IrReportData } from '@/src/api/irReportService';

export default function IRReportScreen() {
  const [report, setReport] = useState<IrReportData | null>(null);

  useEffect(() => {
    getIrReport().then(setReport);
  }, []);

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>IR Report</Text>
      <Text style={styles.incidentId}>{report.incidentId}</Text>
      <Text style={styles.summary}>{report.summary}</Text>

      {report.sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  incidentId: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
