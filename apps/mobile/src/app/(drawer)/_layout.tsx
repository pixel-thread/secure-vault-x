import { HeaderComponent } from '@/src/components/common/StackHeader';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from 'nativewind';

const DrawerLayout = () => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        drawerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        drawerActiveTintColor: '#10b981',
        drawerInactiveTintColor: isDarkMode ? '#a1a1aa' : '#71717a',
        headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
      }}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          headerTitle: 'SecureVault X',
          drawerLabel: 'My Vault',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="lock-closed-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          headerTitle: 'Security Settings',
          drawerLabel: 'Settings',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="readme"
        options={{
          headerTitle: 'README',
          drawerLabel: 'Documentation',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          headerTitle: 'About',
          drawerLabel: 'About Us',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
