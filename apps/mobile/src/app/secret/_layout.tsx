import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function SecretLayout() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
        contentStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        animation: 'slide_from_right',
      }}
    />
  );
}
