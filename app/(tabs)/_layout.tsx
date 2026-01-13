import { useTheme } from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { BookMarked, GraduationCap, Sparkles } from 'lucide-react-native';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <BookMarked
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{
          title: 'Study',
          tabBarIcon: ({ color, focused }) => (
            <GraduationCap
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
