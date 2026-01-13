import { db } from '@/db/client';
import { seedDatabase } from '@/db/seed';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import migrations from '../drizzle/migrations';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDatabase() {
      try {
        await migrate(db, migrations);
        await seedDatabase();
        setDbReady(true);
      } catch (e) {
        console.error('Database init failed', e);
        setDbReady(true); // Continue anyway
      }
    }
    initDatabase();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="note/[id]" />
      <Stack.Screen name="note/detail-[id]" />
      <Stack.Screen name="chat/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="quiz/[id]" />
      <Stack.Screen name="courses/index" />
    </Stack>
  );
}
