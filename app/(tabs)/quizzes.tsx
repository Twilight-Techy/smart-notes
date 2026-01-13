import { db } from '@/db/client';
import type { Note, Quiz } from '@/db/schema';
import { notes, quizzes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { desc, eq } from 'drizzle-orm';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Award, Brain, Clock, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type QuizWithNote = Quiz & { note?: Note };

export default function Quizzes() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [allQuizzes, setAllQuizzes] = useState<QuizWithNote[]>([]);

    useFocusEffect(
        useCallback(() => {
            fetchQuizzes();
        }, [])
    );

    const fetchQuizzes = async () => {
        const quizList = await db
            .select()
            .from(quizzes)
            .orderBy(desc(quizzes.createdAt));

        // Fetch associated notes
        const quizzesWithNotes = await Promise.all(
            quizList.map(async (quiz) => {
                const noteResult = await db.select().from(notes).where(eq(notes.id, quiz.noteId));
                return {
                    ...quiz,
                    note: noteResult[0],
                };
            })
        );

        setAllQuizzes(quizzesWithNotes);
    };

    const handleDelete = async (quizId: number) => {
        Alert.alert('Delete Quiz', 'Are you sure you want to delete this quiz result?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await db.delete(quizzes).where(eq(quizzes.id, quizId));
                    fetchQuizzes();
                },
            },
        ]);
    };

    const completedQuizzes = allQuizzes.filter((q) => q.completedAt);
    const incompleteQuizzes = allQuizzes.filter((q) => !q.completedAt);

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View className="px-6 pt-14 pb-6" style={{ backgroundColor: theme.surface }}>
                <Text className="text-3xl font-bold" style={{ color: theme.text }}>
                    Quizzes
                </Text>
                <Text className="text-sm mt-2" style={{ color: theme.textSecondary }}>
                    Your quiz history and results
                </Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {allQuizzes.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Brain size={48} color={theme.textSecondary} />
                        <Text className="text-lg mt-4 text-center" style={{ color: theme.textSecondary }}>
                            No quizzes yet
                        </Text>
                        <Text className="text-sm mt-2 text-center" style={{ color: theme.textTertiary }}>
                            Take a quiz on any note to get started
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Completed Quizzes */}
                        {completedQuizzes.length > 0 && (
                            <View className="mb-6">
                                <Text
                                    className="text-sm font-semibold mb-3"
                                    style={{ color: theme.textSecondary }}
                                >
                                    Completed
                                </Text>
                                {completedQuizzes.map((quiz) => (
                                    <View
                                        key={quiz.id}
                                        className="mb-3 p-4 rounded-xl"
                                        style={{ backgroundColor: theme.surface }}
                                    >
                                        <View className="flex-row items-start justify-between mb-2">
                                            <View className="flex-1">
                                                <Text
                                                    className="text-lg font-semibold mb-1"
                                                    style={{ color: theme.text }}
                                                >
                                                    {quiz.note?.title || 'Unknown Note'}
                                                </Text>
                                                {quiz.topic && (
                                                    <Text className="text-sm mb-1" style={{ color: theme.textSecondary }}>
                                                        Topic: {quiz.topic}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => handleDelete(quiz.id)}
                                                className="p-2"
                                            >
                                                <Trash2 size={18} color={theme.error} />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="flex-row items-center gap-4">
                                            <View className="flex-row items-center">
                                                <Award size={16} color={theme.primary} />
                                                <Text className="ml-2 font-semibold" style={{ color: theme.primary }}>
                                                    {quiz.score}%
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center">
                                                <Clock size={16} color={theme.textSecondary} />
                                                <Text className="ml-2 text-sm" style={{ color: theme.textSecondary }}>
                                                    {quiz.completedAt
                                                        ? new Date(quiz.completedAt).toLocaleDateString()
                                                        : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Incomplete Quizzes */}
                        {incompleteQuizzes.length > 0 && (
                            <View className="mb-6">
                                <Text
                                    className="text-sm font-semibold mb-3"
                                    style={{ color: theme.textSecondary }}
                                >
                                    In Progress
                                </Text>
                                {incompleteQuizzes.map((quiz) => (
                                    <TouchableOpacity
                                        key={quiz.id}
                                        className="mb-3 p-4 rounded-xl"
                                        style={{ backgroundColor: theme.surface }}
                                        onPress={() => router.push(`/quiz/${quiz.noteId}`)}
                                    >
                                        <Text className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
                                            {quiz.note?.title || 'Unknown Note'}
                                        </Text>
                                        {quiz.topic && (
                                            <Text className="text-sm" style={{ color: theme.textSecondary }}>
                                                Topic: {quiz.topic}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
