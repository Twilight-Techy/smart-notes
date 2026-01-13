import { NOTE_TYPES, NoteContentType } from '@/constants/Colors';
import { db } from '@/db/client';
import type { Note, Quiz } from '@/db/schema';
import { chats, notes, quizzes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { flashModel, proModel } from '@/lib/gemini';
import { desc, eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ArrowLeft,
    Award,
    Brain,
    ChevronDown,
    ChevronUp,
    Edit3,
    FileText,
    FileType,
    Image as ImageIcon,
    Maximize2,
    MessageCircle,
    Minimize2,
    Play,
    Send,
    Sparkles,
    Trash2,
    X
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const NoteTypeIcon = ({ type, size, color }: { type: string; size: number; color: string }) => {
    switch (type) {
        case 'pdf':
            return <FileType size={size} color={color} />;
        case 'image':
            return <ImageIcon size={size} color={color} />;
        default:
            return <FileText size={size} color={color} />;
    }
};

export default function NoteDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const noteId = Number(String(id).replace('detail-', ''));
    const { theme, isDark } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);

    const [note, setNote] = useState<Note | null>(null);
    const [noteQuizzes, setNoteQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    // Expandable sections
    const [keyPointsExpanded, setKeyPointsExpanded] = useState(false);
    const [contentExpanded, setContentExpanded] = useState(false);
    const [quizzesExpanded, setQuizzesExpanded] = useState(false);

    // Chat overlay
    const [chatVisible, setChatVisible] = useState(false);
    const [chatFullScreen, setChatFullScreen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const chatScrollRef = useRef<ScrollView>(null);

    // Parsed AI data
    const [concepts, setConcepts] = useState<string[]>([]);
    const [topics, setTopics] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, [noteId]);

    const loadData = async () => {
        const result = await db.select().from(notes).where(eq(notes.id, noteId));
        if (result.length > 0) {
            setNote(result[0]);
            if (result[0].aiConcepts) {
                try { setConcepts(JSON.parse(result[0].aiConcepts)); } catch (e) { }
            }
            if (result[0].topics) {
                try { setTopics(JSON.parse(result[0].topics)); } catch (e) { }
            }
        }

        const quizList = await db.select().from(quizzes)
            .where(eq(quizzes.noteId, noteId))
            .orderBy(desc(quizzes.createdAt));
        setNoteQuizzes(quizList);

        // Load chat history
        const chatResult = await db.select().from(chats).where(eq(chats.noteId, noteId));
        if (chatResult.length > 0) {
            try { setMessages(JSON.parse(chatResult[0].messages)); } catch (e) { }
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
2. Key concepts (5-7 important terms/ideas)
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
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                await db.update(notes)
                    .set({
                        aiSummary: analysis.summary,
                        aiConcepts: JSON.stringify(analysis.concepts),
                        topics: JSON.stringify(analysis.topics),
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(notes.id, noteId));
                await loadData();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to analyze note');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert('Delete Note', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await db.delete(notes).where(eq(notes.id, noteId));
                    router.back();
                },
            },
        ]);
    };

    // Chat functions
    const sendMessage = async () => {
        if (!inputText.trim() || !note) return;

        const userMessage: Message = { role: 'user', content: inputText.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText('');
        setSending(true);

        try {
            const prompt = `You are a helpful educational assistant. Answer questions about this note concisely.

Title: ${note.title}
Content: ${note.content}

Question: ${userMessage.content}`;

            const result = await flashModel.generateContent(prompt);
            const aiResponse = result.response.text();
            const aiMessage: Message = { role: 'assistant', content: aiResponse };
            const updatedMessages = [...newMessages, aiMessage];
            setMessages(updatedMessages);

            // Save to database
            const existingChat = await db.select().from(chats).where(eq(chats.noteId, noteId));
            if (existingChat.length > 0) {
                await db.update(chats)
                    .set({ messages: JSON.stringify(updatedMessages) })
                    .where(eq(chats.noteId, noteId));
            } else {
                await db.insert(chats).values({
                    noteId: noteId,
                    messages: JSON.stringify(updatedMessages),
                });
            }

            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'pdf': return theme.typePdf;
            case 'document': return theme.typeWord;
            case 'image': return theme.typeImage;
            default: return theme.typeText;
        }
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

    const typeColor = getTypeColor(note.contentType);

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Decorative header background */}
            <View
                className="absolute top-0 left-0 right-0 h-48"
                style={{
                    backgroundColor: typeColor,
                    opacity: 0.15,
                    borderBottomLeftRadius: 60,
                    borderBottomRightRadius: 60,
                }}
            />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
                <TouchableOpacity
                    className="w-12 h-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: theme.surface }}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color={theme.text} />
                </TouchableOpacity>

                <View className="flex-row gap-2">
                    <TouchableOpacity
                        className="w-12 h-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: theme.surface }}
                        onPress={() => router.push(`/note/${noteId}`)}
                    >
                        <Edit3 size={20} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="w-12 h-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: theme.surface }}
                        onPress={handleDelete}
                    >
                        <Trash2 size={20} color={theme.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Title Section */}
                <View className="px-6 pb-6">
                    <View className="flex-row items-center mb-3">
                        <View
                            className="flex-row items-center px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: `${typeColor}20` }}
                        >
                            <NoteTypeIcon type={note.contentType} size={14} color={typeColor} />
                            <Text className="text-xs font-semibold ml-1.5" style={{ color: typeColor }}>
                                {NOTE_TYPES[note.contentType as NoteContentType]?.label || 'Text'}
                            </Text>
                        </View>
                        <Text className="text-xs ml-3" style={{ color: theme.textTertiary }}>
                            {new Date(note.updatedAt).toLocaleDateString('en-US', {
                                month: 'long', day: 'numeric', year: 'numeric'
                            })}
                        </Text>
                    </View>
                    <Text className="text-3xl font-bold" style={{ color: theme.text }}>
                        {note.title}
                    </Text>
                </View>

                {/* AI Summary Section */}
                <View className="px-6 mb-6">
                    {note.aiSummary ? (
                        <View
                            className="p-5 rounded-3xl"
                            style={{
                                backgroundColor: theme.surface,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                elevation: 3,
                            }}
                        >
                            <View className="flex-row items-center mb-3">
                                <View
                                    className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: `${theme.accent}20` }}
                                >
                                    <Sparkles size={16} color={theme.accent} />
                                </View>
                                <Text className="text-sm font-semibold" style={{ color: theme.accent }}>
                                    AI Summary
                                </Text>
                            </View>
                            <Text className="text-base leading-6" style={{ color: theme.text }}>
                                {note.aiSummary}
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="flex-row items-center justify-center py-4 rounded-2xl"
                            style={{
                                backgroundColor: theme.primary,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.3,
                                shadowRadius: 12,
                                elevation: 5,
                            }}
                            onPress={analyzeNote}
                            disabled={analyzing}
                        >
                            {analyzing ? (
                                <ActivityIndicator size="small" color={theme.textOnPrimary} />
                            ) : (
                                <>
                                    <Sparkles size={20} color={theme.textOnPrimary} />
                                    <Text className="ml-2 font-semibold text-base" style={{ color: theme.textOnPrimary }}>
                                        Analyze with AI
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Key Points Section (Expandable) */}
                {concepts.length > 0 && (
                    <View className="px-6 mb-6">
                        <Pressable
                            className="p-5 rounded-3xl"
                            style={{
                                backgroundColor: theme.surface,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                elevation: 3,
                            }}
                            onPress={() => setKeyPointsExpanded(!keyPointsExpanded)}
                        >
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View
                                        className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: `${theme.primary}20` }}
                                    >
                                        <Brain size={16} color={theme.primary} />
                                    </View>
                                    <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
                                        Key Concepts ({concepts.length})
                                    </Text>
                                </View>
                                {keyPointsExpanded ? (
                                    <ChevronUp size={20} color={theme.textSecondary} />
                                ) : (
                                    <ChevronDown size={20} color={theme.textSecondary} />
                                )}
                            </View>

                            {keyPointsExpanded ? (
                                <View className="gap-2">
                                    {concepts.map((concept, idx) => (
                                        <View
                                            key={idx}
                                            className="flex-row items-center p-3 rounded-xl"
                                            style={{ backgroundColor: theme.surfaceVariant }}
                                        >
                                            <View
                                                className="w-6 h-6 rounded-lg items-center justify-center mr-3"
                                                style={{ backgroundColor: theme.primary }}
                                            >
                                                <Text className="text-xs font-bold" style={{ color: theme.textOnPrimary }}>
                                                    {idx + 1}
                                                </Text>
                                            </View>
                                            <Text className="flex-1 text-base" style={{ color: theme.text }}>
                                                {concept}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap gap-2">
                                    {concepts.slice(0, 4).map((concept, idx) => (
                                        <View
                                            key={idx}
                                            className="px-3 py-2 rounded-lg"
                                            style={{ backgroundColor: theme.surfaceVariant }}
                                        >
                                            <Text className="text-sm" style={{ color: theme.text }}>
                                                {concept}
                                            </Text>
                                        </View>
                                    ))}
                                    {concepts.length > 4 && (
                                        <View
                                            className="px-3 py-2 rounded-lg"
                                            style={{ backgroundColor: theme.primary }}
                                        >
                                            <Text className="text-sm font-semibold" style={{ color: theme.textOnPrimary }}>
                                                +{concepts.length - 4} more
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Note Content Preview (Expandable) */}
                <View className="px-6 mb-6">
                    <Pressable
                        className="rounded-3xl overflow-hidden"
                        style={{
                            backgroundColor: theme.surface,
                            shadowColor: theme.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            elevation: 3,
                        }}
                        onPress={() => setContentExpanded(!contentExpanded)}
                    >
                        {/* Type indicator bar */}
                        <View className="h-1" style={{ backgroundColor: typeColor }} />

                        <View className="p-5">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    <View
                                        className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: `${typeColor}20` }}
                                    >
                                        <NoteTypeIcon type={note.contentType} size={16} color={typeColor} />
                                    </View>
                                    <Text className="text-sm font-semibold" style={{ color: typeColor }}>
                                        Note Content
                                    </Text>
                                </View>
                                {contentExpanded ? (
                                    <ChevronUp size={20} color={theme.textSecondary} />
                                ) : (
                                    <ChevronDown size={20} color={theme.textSecondary} />
                                )}
                            </View>

                            {/* Content Preview based on type */}
                            {note.contentType === 'image' && note.fileUri ? (
                                <View className="rounded-xl overflow-hidden">
                                    <Image
                                        source={{ uri: note.fileUri }}
                                        className="w-full h-48"
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <Text
                                    className="text-base leading-6"
                                    numberOfLines={contentExpanded ? undefined : 4}
                                    style={{ color: theme.textSecondary }}
                                >
                                    {note.content || 'No content available'}
                                </Text>
                            )}
                        </View>
                    </Pressable>
                </View>

                {/* Topics Section */}
                {topics.length > 0 && (
                    <View className="px-6 mb-6">
                        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                            Topics
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                {topics.map((topic, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        className="flex-row items-center px-4 py-3 rounded-2xl"
                                        style={{ backgroundColor: theme.surface }}
                                        onPress={() => router.push(`/quiz/${noteId}?topic=${encodeURIComponent(topic)}`)}
                                    >
                                        <Brain size={16} color={theme.primary} />
                                        <Text className="ml-2 font-medium" style={{ color: theme.text }}>
                                            {topic}
                                        </Text>
                                        <Play size={14} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Quizzes Section (Expandable) */}
                <View className="px-6 mb-6">
                    <Pressable
                        className="p-5 rounded-3xl"
                        style={{
                            backgroundColor: theme.surface,
                            shadowColor: theme.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            elevation: 3,
                        }}
                        onPress={() => setQuizzesExpanded(!quizzesExpanded)}
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View
                                    className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: `${theme.success}20` }}
                                >
                                    <Award size={16} color={theme.success} />
                                </View>
                                <Text className="text-sm font-semibold" style={{ color: theme.success }}>
                                    Quizzes ({noteQuizzes.length})
                                </Text>
                            </View>
                            {quizzesExpanded ? (
                                <ChevronUp size={20} color={theme.textSecondary} />
                            ) : (
                                <ChevronDown size={20} color={theme.textSecondary} />
                            )}
                        </View>

                        {noteQuizzes.length === 0 ? (
                            <TouchableOpacity
                                className="flex-row items-center justify-center py-3 rounded-xl"
                                style={{ backgroundColor: theme.surfaceVariant }}
                                onPress={() => router.push(`/quiz/${noteId}`)}
                            >
                                <Play size={16} color={theme.primary} />
                                <Text className="ml-2 font-medium" style={{ color: theme.primary }}>
                                    Generate Quiz
                                </Text>
                            </TouchableOpacity>
                        ) : quizzesExpanded ? (
                            <View className="gap-2">
                                {noteQuizzes.map((quiz) => (
                                    <View
                                        key={quiz.id}
                                        className="flex-row items-center justify-between p-3 rounded-xl"
                                        style={{ backgroundColor: theme.surfaceVariant }}
                                    >
                                        <View>
                                            <Text className="font-medium" style={{ color: theme.text }}>
                                                {quiz.topic || 'General Quiz'}
                                            </Text>
                                            <Text className="text-xs mt-1" style={{ color: theme.textTertiary }}>
                                                {quiz.completedAt
                                                    ? new Date(quiz.completedAt).toLocaleDateString()
                                                    : 'In progress'}
                                            </Text>
                                        </View>
                                        {quiz.score !== null && (
                                            <View
                                                className="px-3 py-1.5 rounded-lg"
                                                style={{ backgroundColor: quiz.score >= 70 ? `${theme.success}20` : `${theme.warning}20` }}
                                            >
                                                <Text
                                                    className="font-bold"
                                                    style={{ color: quiz.score >= 70 ? theme.success : theme.warning }}
                                                >
                                                    {quiz.score}%
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                                <TouchableOpacity
                                    className="flex-row items-center justify-center py-3 rounded-xl"
                                    style={{ backgroundColor: theme.primary }}
                                    onPress={() => router.push(`/quiz/${noteId}`)}
                                >
                                    <Play size={16} color={theme.textOnPrimary} />
                                    <Text className="ml-2 font-semibold" style={{ color: theme.textOnPrimary }}>
                                        New Quiz
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-3">
                                {noteQuizzes.slice(0, 2).map((quiz) => (
                                    <View
                                        key={quiz.id}
                                        className="flex-row items-center px-3 py-2 rounded-lg"
                                        style={{ backgroundColor: theme.surfaceVariant }}
                                    >
                                        <Text className="text-sm" style={{ color: theme.text }}>
                                            {quiz.topic || 'Quiz'}
                                        </Text>
                                        {quiz.score !== null && (
                                            <Text className="ml-2 font-bold text-sm" style={{ color: theme.success }}>
                                                {quiz.score}%
                                            </Text>
                                        )}
                                    </View>
                                ))}
                                {noteQuizzes.length > 2 && (
                                    <Text className="text-sm" style={{ color: theme.textSecondary }}>
                                        +{noteQuizzes.length - 2} more
                                    </Text>
                                )}
                            </View>
                        )}
                    </Pressable>
                </View>

                <View className="h-32" />
            </ScrollView>

            {/* Chat Button */}
            <TouchableOpacity
                className="absolute bottom-8 right-6 flex-row items-center px-6 py-4 rounded-2xl"
                style={{
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                }}
                onPress={() => setChatVisible(true)}
            >
                <MessageCircle size={22} color={theme.textOnPrimary} />
                <Text className="ml-2 font-semibold text-base" style={{ color: theme.textOnPrimary }}>
                    Chat
                </Text>
            </TouchableOpacity>

            {/* Chat Overlay Modal */}
            <Modal
                visible={chatVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setChatVisible(false)}
            >
                <View className="flex-1">
                    {/* Backdrop */}
                    {!chatFullScreen && (
                        <Pressable
                            className="flex-1 bg-black/40"
                            style={{ height: chatFullScreen ? 0 : SCREEN_HEIGHT * 0.35 }}
                            onPress={() => setChatVisible(false)}
                        />
                    )}

                    {/* Chat Container */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{
                            height: chatFullScreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.65,
                            backgroundColor: theme.surface,
                            borderTopLeftRadius: chatFullScreen ? 0 : 32,
                            borderTopRightRadius: chatFullScreen ? 0 : 32,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 10,
                        }}
                    >
                        {/* Chat Header */}
                        <View
                            className="flex-row items-center justify-between px-6 py-4"
                            style={{
                                borderBottomWidth: 1,
                                borderBottomColor: theme.border,
                                paddingTop: chatFullScreen ? 50 : 16,
                            }}
                        >
                            <View className="flex-1">
                                <Text className="text-xs" style={{ color: theme.textSecondary }}>
                                    Chat with
                                </Text>
                                <Text className="text-lg font-semibold" style={{ color: theme.text }} numberOfLines={1}>
                                    {note.title}
                                </Text>
                            </View>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    className="w-10 h-10 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: theme.surfaceVariant }}
                                    onPress={() => setChatFullScreen(!chatFullScreen)}
                                >
                                    {chatFullScreen ? (
                                        <Minimize2 size={18} color={theme.text} />
                                    ) : (
                                        <Maximize2 size={18} color={theme.text} />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="w-10 h-10 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: theme.surfaceVariant }}
                                    onPress={() => {
                                        setChatVisible(false);
                                        setChatFullScreen(false);
                                    }}
                                >
                                    <X size={18} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Messages */}
                        <ScrollView
                            ref={chatScrollRef}
                            className="flex-1 px-6 py-4"
                            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                        >
                            {messages.length === 0 && (
                                <View className="items-center justify-center py-10">
                                    <View
                                        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                                        style={{ backgroundColor: theme.surfaceVariant }}
                                    >
                                        <MessageCircle size={28} color={theme.primary} />
                                    </View>
                                    <Text className="text-center text-base" style={{ color: theme.textSecondary }}>
                                        Ask me anything about this note!
                                    </Text>
                                </View>
                            )}
                            {messages.map((msg, idx) => (
                                <View
                                    key={idx}
                                    className={`mb-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <View
                                        className="max-w-[85%] px-4 py-3 rounded-2xl"
                                        style={{
                                            backgroundColor: msg.role === 'user' ? theme.primary : theme.surfaceVariant,
                                            borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                                            borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                                        }}
                                    >
                                        <Text
                                            className="text-base leading-6"
                                            style={{ color: msg.role === 'user' ? theme.textOnPrimary : theme.text }}
                                        >
                                            {msg.content}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            {sending && (
                                <View className="items-start mb-3">
                                    <View
                                        className="px-4 py-3 rounded-2xl"
                                        style={{ backgroundColor: theme.surfaceVariant }}
                                    >
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input */}
                        <View
                            className="flex-row items-center gap-3 px-6 py-4"
                            style={{
                                borderTopWidth: 1,
                                borderTopColor: theme.border,
                                paddingBottom: Platform.OS === 'ios' ? 34 : 16,
                            }}
                        >
                            <TextInput
                                className="flex-1 px-4 py-3 rounded-2xl text-base"
                                style={{
                                    backgroundColor: theme.surfaceVariant,
                                    color: theme.text,
                                    maxHeight: 100,
                                }}
                                placeholder="Ask a question..."
                                placeholderTextColor={theme.textTertiary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity
                                className="w-12 h-12 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: inputText.trim() ? theme.primary : theme.surfaceVariant,
                                }}
                                onPress={sendMessage}
                                disabled={sending || !inputText.trim()}
                            >
                                <Send size={20} color={inputText.trim() ? theme.textOnPrimary : theme.textTertiary} />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}
