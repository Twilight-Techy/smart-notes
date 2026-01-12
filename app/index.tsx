import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
            setIsFirstLaunch(value === null);
        });
    }, []);

    if (isFirstLaunch === null) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0F2027]">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return <Redirect href={isFirstLaunch ? "/onboarding" : "/(tabs)"} />;
}
