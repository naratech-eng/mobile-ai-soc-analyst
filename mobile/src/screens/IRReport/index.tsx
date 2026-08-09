import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function IRReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>IR Report</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.body}>
        Incident-response report view lands here in a later slice — demo-representative content,
        not wired to a live backend (that endpoint doesn't exist yet).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
