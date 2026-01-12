import { db } from '@/db/client';
import { notes } from '@/db/schema';
import { textModel } from '@/lib/gemini';
import { eq } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, XCircle } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Question = {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
};

export default function QuizScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        generateQuiz();
    }, [id]);

    const generateQuiz = async () => {
        try {
            // @ts-ignore
            const noteRes = await db.select().from(notes).where(eq(notes.id, Number(id)));
            const content = noteRes[0]?.content || '';

            const prompt = `Based on these notes, generate 3 multiple choice questions. 
      Return ONLY a raw JSON array (no markdown) with this structure: 
      [{id: number, text: string, options: string[], correctIndex: number, explanation: string}].
      Notes: ${content.substring(0, 1000)}`;

            const result = await textModel.generateContent(prompt);
            const txt = result.response.text();
            // Clean up markdown code blocks if any
            const jsonStr = txt.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            setQuestions(data);
        } catch (e) {
            console.error(e);
            // Fallback/Error state
        } finally {
            setLoading(false);
        }
    };

    const handleOption = (index: number) => {
        if (showResult) return;
        setSelectedOption(index);
        setShowResult(true);
        if (index === questions[currentQ].correctIndex) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(c => c + 1);
            setSelectedOption(null);
            setShowResult(false);
        } else {
            // Finish
            router.back();
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0F2027]">
                <ActivityIndicator size="large" color="#a855f7" />
                <Text className="text-white mt-4">Generating Quiz...</Text>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0F2027]">
                <Text className="text-white">Could not generate quiz from this note.</Text>
                <TouchableOpacity onPress={() => router.back()}><Text className="text-blue-400 mt-4">Go Back</Text></TouchableOpacity>
            </View>
        )
    }

    const q = questions[currentQ];

    return (
        <View className="flex-1 bg-[#0F2027]">
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['transparent', 'rgba(168, 85, 247, 0.1)']} className="absolute inset-0" />

            {/* Header */}
            <View className="pt-12 pb-4 px-4 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/10 rounded-full mr-4">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Quiz Mode</Text>
                <View className="flex-1 items-end">
                    <Text className="text-purple-400 font-bold">Score: {score}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-4">
                {/* Progress Bar */}
                <View className="h-1 bg-white/10 rounded-full mb-8">
                    <View className="h-full bg-purple-500 rounded-full" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
                </View>

                <Text className="text-2xl text-white font-bold mb-8">{q.text}</Text>

                <View className="space-y-4">
                    {q.options.map((opt, idx) => {
                        let bgClass = "bg-white/5 border-white/10";
                        if (showResult) {
                            if (idx === q.correctIndex) bgClass = "bg-green-500/20 border-green-500";
                            else if (idx === selectedOption) bgClass = "bg-red-500/20 border-red-500";
                        } else if (selectedOption === idx) {
                            bgClass = "bg-purple-500/20 border-purple-500";
                        }

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => handleOption(idx)}
                                activeOpacity={0.8}
                                disabled={showResult}
                                className={`p-4 rounded-xl border ${bgClass} flex-row justify-between items-center`}
                            >
                                <Text className="text-gray-200 text-lg font-medium">{opt}</Text>
                                {showResult && idx === q.correctIndex && <CheckCircle color="#22c55e" size={24} weight="fill" />}
                                {showResult && idx === selectedOption && idx !== q.correctIndex && <XCircle color="#ef4444" size={24} weight="fill" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {showResult && (
                    <View className="mt-8 p-4 bg-white/5 rounded-xl border-l-4 border-yellow-400">
                        <Text className="text-yellow-400 font-bold mb-1">Explanation</Text>
                        <Text className="text-gray-300">{q.explanation}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            {showResult && (
                <View className="p-6">
                    <TouchableOpacity onPress={nextQuestion} className="w-full bg-purple-600 py-4 rounded-xl items-center shadow-lg shadow-purple-500/40">
                        <Text className="text-white font-bold text-lg">{currentQ < questions.length - 1 ? "Next Question" : "Finish"}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
