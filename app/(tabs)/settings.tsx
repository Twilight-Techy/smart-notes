import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

export default function Settings() {
    return (
        <View className="flex-1 justify-center items-center">
            <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} className="absolute inset-0" />
            <Text className="text-white text-lg">Settings</Text>
        </View>
    );
}
