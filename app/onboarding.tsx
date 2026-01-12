import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function Onboarding() {
    const router = useRouter();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50);

    useEffect(() => {
        opacity.value = withDelay(300, withTiming(1, { duration: 1000 }));
        translateY.value = withDelay(300, withSpring(0));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/(tabs)');
    };

    return (
        <View className="flex-1">
            <StatusBar style="light" />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']} // Deep space/ocean gradient start
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
            />

            {/* Dynamic Red/Blue Mesh (Simulated with absolute gradients) */}
            <LinearGradient
                colors={['rgba(255, 65, 108, 0.6)', 'transparent']}
                style={{ position: 'absolute', width: width * 1.5, height: width * 1.5, top: -100, left: -100, borderRadius: width }}
            />
            <LinearGradient
                colors={['rgba(44, 62, 80, 0)', 'rgba(52, 152, 219, 0.5)']}
                style={{ position: 'absolute', width: width * 1.5, height: width * 1.5, bottom: -100, right: -100, borderRadius: width }}
            />

            <View className="flex-1 justify-center items-center px-6">
                <Animated.View style={animatedStyle} className="items-center">
                    <View className="w-24 h-24 bg-red-500 rounded-full blur-2xl absolute -top-10 -left-10 opacity-50" />
                    <View className="w-24 h-24 bg-blue-500 rounded-full blur-2xl absolute -bottom-10 -right-10 opacity-50" />

                    <Text className="text-5xl font-bold text-white mb-2 text-center tracking-tighter">
                        Smart<Text className="text-blue-400">Notes</Text>
                    </Text>
                    <Text className="text-xl text-gray-300 text-center mb-12 font-medium">
                        Your notes, supercharged by AI.
                    </Text>

                    <TouchableOpacity
                        onPress={handleGetStarted}
                        activeOpacity={0.8}
                        className="bg-white px-10 py-4 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Text className="text-gray-900 font-bold text-lg">
                            Get Started
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}
