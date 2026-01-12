import NoteCard from '@/components/NoteCard';
import { db } from '@/db/client';
import { Note, notes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Plus } from 'phosphor-react-native';
import React, { useCallback, useState } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      // In a real app with Expo SQLite, this is synchronous usually for small data, but Drizzle might be async depending on driver
      // drizzle-orm/expo-sqlite driver operations are usually sync if using openDatabaseSync, but let's assume async access pattern for safety
      const result = await db.select().from(notes).orderBy(desc(notes.updatedAt));
      setUserNotes(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const renderHeader = () => (
    <View className="mt-12 mb-6 px-4">
      <Text className="text-gray-400 text-lg font-medium">Good Morning,</Text>
      <Text className="text-white text-3xl font-bold tracking-tight">
        Your Notes
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center mt-20">
      <View className="w-16 h-16 bg-white/10 rounded-full justify-center items-center mb-4">
        <Plus size={32} color="#FFF" />
      </View>
      <Text className="text-gray-300 text-lg font-medium">No notes yet</Text>
      <Text className="text-gray-500 text-sm mt-1">Tap + to create one</Text>
    </View>
  );

  return (
    <View className="flex-1">
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} className="absolute inset-0" />

      {/* Ambient Mesh */}
      <LinearGradient
        colors={['rgba(255, 65, 108, 0.2)', 'transparent']}
        style={{ position: 'absolute', width: width, height: width, top: 0, left: 0 }}
      />

      <FlatList
        data={userNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <NoteCard note={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/note/new')}
        className="absolute bottom-24 right-6 w-16 h-16 bg-blue-500 rounded-full justify-center items-center shadow-lg shadow-blue-500/40"
        activeOpacity={0.8}
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
