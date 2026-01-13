import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { Moon, Palette, Sun } from 'lucide-react-native';
import { ScrollView, Text, useColorScheme, View } from 'react-native';

export default function Settings() {
    const { theme, isDark } = useTheme();
    const systemColorScheme = useColorScheme();

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View className="px-6 pt-14 pb-6" style={{ backgroundColor: theme.surface }}>
                <Text className="text-3xl font-bold" style={{ color: theme.text }}>
                    Settings
                </Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Theme Section */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                        Appearance
                    </Text>

                    <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
                        <View className="flex-row items-center">
                            {isDark ? (
                                <Moon size={20} color={theme.primary} />
                            ) : (
                                <Sun size={20} color={theme.primary} />
                            )}
                            <Text className="ml-3 flex-1 text-base font-medium" style={{ color: theme.text }}>
                                Theme
                            </Text>
                            <Text className="text-sm" style={{ color: theme.textSecondary }}>
                                {systemColorScheme === 'dark' ? 'Dark' : 'Light'}
                            </Text>
                        </View>
                        <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
                            Follows system settings
                        </Text>
                    </View>
                </View>

                {/* About Section */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                        About
                    </Text>

                    <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
                        <View className="flex-row items-center mb-3">
                            <Palette size={20} color={theme.primary} />
                            <Text className="ml-3 text-base font-medium" style={{ color: theme.text }}>
                                Ruby
                            </Text>
                        </View>
                        <Text className="text-sm leading-6" style={{ color: theme.textSecondary }}>
                            An intelligent educational note-taking app powered by Google Gemini AI.
                            Organize your study materials, chat with your notes, and test your knowledge through AI-generated quizzes.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
