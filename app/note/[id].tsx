import { db } from '@/db/client';
import { notes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, Trash } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NoteScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const isNew = id === 'new';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(isNew);

    useEffect(() => {
        if (!isNew) {
            loadNote();
        }
    }, [id]);

    const loadNote = async () => {
        try {
            // @ts-ignore
            const result = await db.select().from(notes).where(eq(notes.id, Number(id)));
            if (result.length > 0) {
                setTitle(result[0].title);
                setContent(result[0].content || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            if (isNew) {
                await db.insert(notes).values({
                    title,
                    content,
                });
                router.back();
            } else {
                await db.update(notes).set({
                    title,
                    content,
                    updatedAt: new Date(),
                    // @ts-ignore
                }).where(eq(notes.id, Number(id)));
                setIsEditing(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            // @ts-ignore
            await db.delete(notes).where(eq(notes.id, Number(id)));
            router.back();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0F2027]">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0F2027]">
            <StatusBar style="light" />
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['transparent', 'rgba(52, 152, 219, 0.1)']}
                className="absolute inset-0"
            />

            {/* Header */}
            <View className="flex-row justify-between items-center pt-12 pb-4 px-4 bg-[#0F2027]/80 z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>

                <View className="flex-row space-x-4">
                    {!isNew && !isEditing && (
                        <TouchableOpacity onPress={handleDelete} className="p-2 bg-red-500/20 rounded-full mr-2">
                            <Trash color="#ef4444" size={24} />
                        </TouchableOpacity>
                    )}

                    {!isNew && !isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2 bg-white/10 rounded-full">
                            <Check color="white" size={24} style={{ display: 'none' }} />
                            {/* Re-using button style but need logic for Edit icon (Pencil) - importing it first */}
                            <Text className="text-blue-400 font-bold px-2">Edit</Text>
                        </TouchableOpacity>
                    )}

                    {isEditing && (
                        <TouchableOpacity onPress={handleSave} disabled={saving} className="p-2 bg-blue-500/20 rounded-full">
                            {saving ? <ActivityIndicator size="small" color="#3b82f6" /> : <Check color="#3b82f6" size={24} />}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {isEditing ? (
                    <>
                        <TextInput
                            className="text-3xl font-bold text-white mb-4"
                            placeholder="Title"
                            placeholderTextColor="#6B7280"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            className="text-lg text-gray-300 leading-relaxed font-normal min-h-[300px]"
                            placeholder="Start typing..."
                            placeholderTextColor="#6B7280"
                            multiline
                            textAlignVertical="top"
                            value={content}
                            onChangeText={setContent}
                        />
                    </>
                ) : (
                    <>
                        <Text className="text-3xl font-bold text-white mb-4">{title}</Text>
                        <Text className="text-lg text-gray-300 leading-relaxed font-normal min-h-[300px]">{content}</Text>
                    </>
                )}
                <View className="h-32" />
            </ScrollView>

            {/* AI Actions Bottom Bar */}
            {!isEditing && (
                <View className="absolute bottom-10 left-4 right-4 flex-row justify-center space-x-4">
                    {/* Chat Button */}
                    <TouchableOpacity
                        onPress={() => router.push(`/chat/${id}`)}
                        className="flex-1 bg-blue-600/90 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-500/20"
                        activeOpacity={0.8}
                    >
                        {/* Need to import icons properly, assuming Phosphor imported in file */}
                        <Text className="text-white font-bold ml-2">Chat</Text>
                    </TouchableOpacity>

                    {/* Quiz Button */}
                    <TouchableOpacity
                        onPress={() => router.push(`/quiz/${id}`)}
                        className="flex-1 bg-purple-600/90 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-purple-500/20"
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-bold ml-2">Quiz Mode</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
