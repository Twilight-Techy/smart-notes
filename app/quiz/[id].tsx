import { db } from '@/db/client';
import type { Note } from '@/db/schema';
import { notes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { proModel } from '@/lib/gemini';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Question = {
    type: 'mcq' | 'true-false';
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
};

export default function QuizSession() {
    const router = useRouter();
    const { id, topic } = useLocalSearchParams();
    const { theme, isDark } = useTheme();

    const [note, setNote] = useState<Note | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadNote();
    }, [id]);

    const loadNote = async () => {
        const result = await db.select().from(notes).where(eq(notes.id, Number(id)));
        if (result.length > 0) {
            setNote(result[0]);
            generateQuiz(result[0]);
        }
    };

    const generateQuiz = async (noteData: Note) => {
        setGenerating(true);
        try {
            const topicFilter = topic ? `Focus on the topic: ${topic}` : 'Cover all topics';
            const prompt = `Generate 5 quiz questions from this educational note.
${topicFilter}

Note Title: ${noteData.title}
Content: ${noteData.content}

Create a mix of:
- Multiple choice questions (4 options each)
- True/False questions

Respond in JSON format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "B",
      "explanation": "..."
    },
    {
      "type": "true-false",
      "question": "...",
      "answer": "True",
      "explanation": "..."
    }
  ]
}`;

            const result = await proModel.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    };

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        setShowFeedback(true);

        if (answer === questions[currentIndex].answer) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else {
            // Quiz complete
            const finalScore = Math.round((score / questions.length) * 100);
            Alert.alert(
                'Quiz Complete!',
                `Your score: ${finalScore}%\n${score}/${questions.length} correct`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    };

    if (generating) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text className="mt-4" style={{ color: theme.text }}>
                    Generating quiz...
                </Text>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
                <Text style={{ color: theme.text }}>No questions generated</Text>
            </View>
        );
    }

    const currentQ = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQ.answer;

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

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

                <Text className="font-semibold" style={{ color: theme.text }}>
                    Question {currentIndex + 1} / {questions.length}
                </Text>

                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Question */}
                <View className="p-6 rounded-xl mb-6" style={{ backgroundColor: theme.surface }}>
                    <Text className="text-xl font-semibold leading-7" style={{ color: theme.text }}>
                        {currentQ.question}
                    </Text>
                </View>

                {/* Options */}
                <View className="gap-3 mb-6">
                    {currentQ.type === 'mcq' && currentQ.options?.map((option, idx) => (
                        <TouchableOpacity
                            key={idx}
                            className="p-4 rounded-xl flex-row items-center justify-between"
                            style={{
                                backgroundColor:
                                    showFeedback && option === currentQ.answer
                                        ? theme.success
                                        : showFeedback && option === selectedAnswer && !isCorrect
                                            ? theme.error
                                            : theme.surface,
                            }}
                            onPress={() => !showFeedback && handleAnswer(option)}
                            disabled={showFeedback}
                        >
                            <Text
                                className="text-base flex-1 font-medium"
                                style={{
                                    color:
                                        showFeedback && (option === currentQ.answer || option === selectedAnswer)
                                            ? '#FFFFFF'
                                            : theme.text,
                                }}
                            >
                                {option}
                            </Text>
                            {showFeedback && option === currentQ.answer && (
                                <Check size={20} color="#FFFFFF" />
                            )}
                            {showFeedback && option === selectedAnswer && !isCorrect && (
                                <X size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    ))}

                    {currentQ.type === 'true-false' && ['True', 'False'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            className="p-4 rounded-xl flex-row items-center justify-between"
                            style={{
                                backgroundColor:
                                    showFeedback && option === currentQ.answer
                                        ? theme.success
                                        : showFeedback && option === selectedAnswer && !isCorrect
                                            ? theme.error
                                            : theme.surface,
                            }}
                            onPress={() => !showFeedback && handleAnswer(option)}
                            disabled={showFeedback}
                        >
                            <Text
                                className="text-base font-medium"
                                style={{
                                    color:
                                        showFeedback && (option === currentQ.answer || option === selectedAnswer)
                                            ? '#FFFFFF'
                                            : theme.text,
                                }}
                            >
                                {option}
                            </Text>
                            {showFeedback && option === currentQ.answer && (
                                <Check size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Explanation */}
                {showFeedback && (
                    <View className="p-4 rounded-xl mb-6" style={{ backgroundColor: theme.surface }}>
                        <Text className="text-sm font-semibold mb-2" style={{ color: theme.primary }}>
                            Explanation
                        </Text>
                        <Text className="text-base leading-6" style={{ color: theme.text }}>
                            {currentQ.explanation}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Next Button */}
            {showFeedback && (
                <View className="px-6 pb-6">
                    <TouchableOpacity
                        className="py-4 rounded-xl items-center"
                        style={{ backgroundColor: theme.primary }}
                        onPress={handleNext}
                    >
                        <Text className="font-semibold text-lg" style={{ color: '#FFFFFF' }}>
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
