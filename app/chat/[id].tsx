import { db } from '@/db/client';
import type { Note } from '@/db/schema';
import { chats, notes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { flashModel } from '@/lib/gemini';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Send, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function ChatOverlay() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);

    const [note, setNote] = useState<Note | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        const noteResult = await db.select().from(notes).where(eq(notes.id, Number(id)));
        if (noteResult.length > 0) {
            setNote(noteResult[0]);
        }

        const chatResult = await db.select().from(chats).where(eq(chats.noteId, Number(id)));
        if (chatResult.length > 0) {
            try {
                const chatMessages = JSON.parse(chatResult[0].messages);
                setMessages(chatMessages);
            } catch (e) { }
        }
    };

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
            const existingChat = await db.select().from(chats).where(eq(chats.noteId, Number(id)));
            if (existingChat.length > 0) {
                await db.update(chats)
                    .set({ messages: JSON.stringify(updatedMessages) })
                    .where(eq(chats.noteId, Number(id)));
            } else {
                await db.insert(chats).values({
                    noteId: Number(id),
                    messages: JSON.stringify(updatedMessages),
                });
            }

            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ backgroundColor: theme.background }}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View
                className="flex-row items-center justify-between px-6 pt-14 pb-4"
                style={{ backgroundColor: theme.surface }}
            >
                <View className="flex-1">
                    <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        Chatting about
                    </Text>
                    <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                        {note?.title || 'Note'}
                    </Text>
                </View>
                <TouchableOpacity
                    className="w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.surfaceVariant }}
                    onPress={() => router.back()}
                >
                    <X size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-6 pt-4"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.length === 0 && (
                    <View className="items-center justify-center py-20">
                        <Text className="text-center" style={{ color: theme.textSecondary }}>
                            Ask me anything about your note!
                        </Text>
                    </View>
                )}
                {messages.map((msg, idx) => (
                    <View
                        key={idx}
                        className={`mb-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <View
                            className="max-w-[80%] p-4 rounded-2xl"
                            style={{
                                backgroundColor: msg.role === 'user' ? theme.primary : theme.surface,
                            }}
                        >
                            <Text
                                className="text-base leading-6"
                                style={{ color: msg.role === 'user' ? '#FFFFFF' : theme.text }}
                            >
                                {msg.content}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Input */}
            <View
                className="flex-row items-center gap-3 px-6 py-4"
                style={{ backgroundColor: theme.surface }}
            >
                <TextInput
                    className="flex-1 px-4 py-3 rounded-xl text-base"
                    style={{
                        backgroundColor: theme.surfaceVariant,
                        color: theme.text,
                    }}
                    placeholder="Ask a question..."
                    placeholderTextColor={theme.textSecondary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    className="w-12 h-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: sending ? theme.surfaceVariant : theme.primary }}
                    onPress={sendMessage}
                    disabled={sending || !inputText.trim()}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Send size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
