import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Brain, Gear, House } from 'phosphor-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0,0,0,0.8)',
          height: 80,
          paddingBottom: 20
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} style={{ flex: 1 }} tint="dark" />
          ) : null,
        tabBarActiveTintColor: '#60A5FA', // blue-400
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <House size={28} color={color} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{
          title: 'Quizzes',
          tabBarIcon: ({ color }) => <Brain size={28} color={color} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Gear size={28} color={color} weight="fill" />,
        }}
      />
    </Tabs>
  );
}
