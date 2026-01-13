import { db } from '@/db/client';
import type { Note } from '@/db/schema';
import { notes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { proModel } from '@/lib/gemini';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Brain, Edit, MessageCircle, Sparkles, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function NoteDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [concepts, setConcepts] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);

    useEffect(() => {
        loadNote();
    }, [id]);

    const loadNote = async () => {
        const result = await db.select().from(notes).where(eq(notes.id, Number(id)));
        if (result.length > 0) {
            setNote(result[0]);
            if (result[0].aiConcepts) {
                try {
                    setConcepts(JSON.parse(result[0].aiConcepts));
                } catch (e) { }
            }
            if (result[0].topics) {
                try {
                    setTopics(JSON.parse(result[0].topics));
                } catch (e) { }
            }
        }
        setLoading(false);
    };

    const analyzeNote = async () => {
        if (!note?.content) {
            Alert.alert('No Content', 'Add some content to analyze');
            return;
        }

        setAnalyzing(true);
        try {
            const prompt = `Analyze this educational note and provide:
1. A concise summary (2-3 sentences)
2. Key concepts (5-7 important terms)
3. Main topics (3-5 topic areas)

Note Title: ${note.title}
Content: ${note.content}

Respond in JSON format:
{
  "summary": "...",
  "concepts": ["concept1", "concept2", ...],
  "topics": ["topic1", "topic2", ...]
}`;

            const result = await proModel.generateContent(prompt);
            const responseText = result.response.text();

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);

                // Update note with AI insights
                await db.update(notes)
                    .set({
                        aiSummary: analysis.summary,
                        aiConcepts: JSON.stringify(analysis.concepts),
                        topics: JSON.stringify(analysis.topics),
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(notes.id, Number(id)));

                // Reload note
                await loadNote();
                Alert.alert('Success', 'Note analyzed successfully!');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to analyze note');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await db.delete(notes).where(eq(notes.id, Number(id)));
                        router.back();
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!note) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <Text style={{ color: theme.text }}>Note not found</Text>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View
                className="flex-row items-center justify-between px-6 pt-14 pb-4"
                style={{ backgroundColor: theme.surface }}
            >
                <TouchableOpacity
                    className="w-10 h-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: theme.surfaceVariant }}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>

                <View className="flex-row gap-2">
                    <TouchableOpacity
                        className="w-10 h-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: theme.surfaceVariant }}
                        onPress={() => router.push(`/note/${id}`)}
                    >
                        <Edit size={18} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="w-10 h-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: theme.surfaceVariant }}
                        onPress={handleDelete}
                    >
                        <Trash2 size={18} color={theme.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1">
                {/* Title */}
                <View className="px-6 pt-6 pb-4">
                    <Text className="text-3xl font-bold" style={{ color: theme.text }}>
                        {note.title}
                    </Text>
                    <Text className="text-sm mt-2" style={{ color: theme.textSecondary }}>
                        {new Date(note.updatedAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* AI Summary */}
                {note.aiSummary ? (
                    <View className="mx-6 mb-6 p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
                        <View className="flex-row items-center mb-3">
                            <Sparkles size={16} color={theme.primary} />
                            <Text className="ml-2 text-sm font-semibold" style={{ color: theme.primary }}>
                                Key Points
                            </Text>
                        </View>
                        <Text className="text-base leading-6" style={{ color: theme.text }}>
                            {note.aiSummary}
                        </Text>
                    </View>
                ) : (
                    <View className="mx-6 mb-6">
                        <TouchableOpacity
                            className="flex-row items-center justify-center py-3 px-4 rounded-xl"
                            style={{ backgroundColor: theme.primary }}
                            onPress={analyzeNote}
                            disabled={analyzing}
                        >
                            {analyzing ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Sparkles size={18} color="#FFFFFF" />
                                    <Text className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                                        Analyze with AI
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Concepts */}
                {concepts.length > 0 && (
                    <View className="px-6 mb-6">
                        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                            Key Concepts
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {concepts.map((concept, idx) => (
                                <View
                                    key={idx}
                                    className="px-3 py-2 rounded-lg"
                                    style={{ backgroundColor: theme.surface }}
                                >
                                    <Text className="text-sm font-medium" style={{ color: theme.primary }}>
                                        {concept}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Topics */}
                {topics.length > 0 && (
                    <View className="px-6 mb-6">
                        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                            Topics
                        </Text>
                        <View className="gap-2">
                            {topics.map((topic, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    className="flex-row items-center justify-between p-4 rounded-xl"
                                    style={{ backgroundColor: theme.surface }}
                                    onPress={() => router.push(`/quiz/${id}?topic=${encodeURIComponent(topic)}`)}
                                >
                                    <Text className="text-base font-medium" style={{ color: theme.text }}>
                                        {topic}
                                    </Text>
                                    <Brain size={20} color={theme.primary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Content */}
                <View className="px-6 mb-6">
                    <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                        Content
                    </Text>
                    <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
                        <Text className="text-base leading-7" style={{ color: theme.text }}>
                            {note.content || 'No content'}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View
                className="flex-row gap-3 px-6 pb-6 pt-4"
                style={{ backgroundColor: theme.surface }}
            >
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
                    style={{ backgroundColor: theme.primary }}
                    onPress={() => router.push(`/chat/${id}`)}
                >
                    <MessageCircle size={20} color="#FFFFFF" />
                    <Text className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                        Chat
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
                    style={{ backgroundColor: theme.primaryVariant }}
                    onPress={() => router.push(`/quiz/${id}`)}
                >
                    <Brain size={20} color="#FFFFFF" />
                    <Text className="ml-2 font-semibold" style={{ color: '#FFFFFF' }}>
                        Quiz
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
