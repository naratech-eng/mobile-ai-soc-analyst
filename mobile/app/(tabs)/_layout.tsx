import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="hunt"
        options={{
          title: 'Hunt',
          tabBarIcon: ({ color }) => <Ionicons name="search" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="ir-report"
        options={{
          title: 'IR Report',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}
