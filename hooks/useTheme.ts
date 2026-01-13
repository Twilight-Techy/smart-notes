import { Colors, Theme } from '@/constants/Colors';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useTheme(): { theme: Theme; isDark: boolean } {
    const colorScheme = useRNColorScheme();
    const isDark = colorScheme === 'dark';

    return {
        theme: isDark ? Colors.dark : Colors.light,
        isDark,
    };
}

// Type-safe theme property accessor
export function useThemeColor<K extends keyof Theme>(property: K): Theme[K] {
    const { theme } = useTheme();
    return theme[property];
}
