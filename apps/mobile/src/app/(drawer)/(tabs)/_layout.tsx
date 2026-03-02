import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#09090b' : '#fff',
          borderTopColor: isDarkMode ? '#27272a' : '#e4e4e7'
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: isDarkMode ? '#a1a1aa' : '#71717a',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Vault',
          tabBarIcon: ({ color }) => (
            <Ionicons name="lock-closed-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="generator"
        options={{
          title: 'Generator',
          tabBarIcon: ({ color }) => <Ionicons name="key-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
