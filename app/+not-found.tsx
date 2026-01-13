import { useTheme } from '@/hooks/useTheme';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { theme } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5" style={{ backgroundColor: theme.background }}>
        <Text className="text-xl font-bold" style={{ color: theme.text }}>
          This screen doesn't exist.
        </Text>
        <Link href="/" className="mt-4 py-4">
          <Text style={{ color: theme.primary }}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
