import { db } from '@/db/client';
import { chats, notes } from '@/db/schema';
import { textModel } from '@/lib/gemini';
import { eq } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, PaperPlaneRight } from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: number;
};

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadChat();
    }, [id]);

    const loadChat = async () => {
        try {
            // Load existing chat history or create new session ref
            // @ts-ignore
            const existingChats = await db.select().from(chats).where(eq(chats.noteId, Number(id)));
            if (existingChats.length > 0) {
                setMessages(JSON.parse(existingChats[0].messages));
            } else {
                // Initial greeting
                setMessages([{
                    id: 'init',
                    text: "Hi! I've read your note. Ask me anything about it.",
                    sender: 'ai',
                    timestamp: Date.now()
                }]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const saveChat = async (newMessages: Message[]) => {
        try {
            // @ts-ignore
            const existing = await db.select().from(chats).where(eq(chats.noteId, Number(id)));
            if (existing.length > 0) {
                // @ts-ignore
                await db.update(chats).set({ messages: JSON.stringify(newMessages) }).where(eq(chats.id, existing[0].id));
            } else {
                await db.insert(chats).values({
                    // @ts-ignore
                    noteId: Number(id),
                    messages: JSON.stringify(newMessages)
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setSending(true);

        try {
            // Fetch note context
            // @ts-ignore
            const noteRes = await db.select().from(notes).where(eq(notes.id, Number(id)));
            const noteContent = noteRes[0]?.content || '';

            const prompt = `Context: ${noteContent}\n\nUser Question: ${userMsg.text}\n\nAnswer concisely based on the context.`;

            const result = await textModel.generateContent(prompt);
            const response = result.response.text();

            const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'ai', timestamp: Date.now() };
            const finalMessages = [...updatedMessages, aiMsg];
            setMessages(finalMessages);
            saveChat(finalMessages);

        } catch (e) {
            console.error(e);
            const errorMsg: Message = { id: Date.now().toString(), text: "Sorry, I couldn't reach Gemini right now.", sender: 'ai', timestamp: Date.now() };
            setMessages([...updatedMessages, errorMsg]);
        } finally {
            setSending(false);
        }
    };

    return (
        <View className="flex-1 bg-[#0F2027]">
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['transparent', 'rgba(52, 152, 219, 0.05)']} className="absolute inset-0" />

            {/* Header */}
            <View className="flex-row items-center pt-12 pb-4 px-4 bg-[#0F2027]/90 border-b border-white/5">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/10 rounded-full mr-4">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Chat with Note</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                    <View className={`mb-4 max-w-[80%] ${item.sender === 'user' ? 'self-end' : 'self-start'}`}>
                        <View className={`p-4 rounded-2xl ${item.sender === 'user' ? 'bg-blue-600 rounded-tr-none' : 'bg-white/10 rounded-tl-none'}`}>
                            <Text className="text-white text-base leading-6">{item.text}</Text>
                        </View>
                    </View>
                )}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                <View className="p-4 bg-[#0F2027] border-t border-white/5 flex-row items-center">
                    <TextInput
                        className="flex-1 bg-white/10 text-white rounded-full px-6 py-4 mr-3 text-base"
                        placeholder="Ask something..."
                        placeholderTextColor="#9CA3AF"
                        value={input}
                        onChangeText={setInput}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending}
                        className={`p-4 rounded-full ${sending ? 'bg-gray-600' : 'bg-blue-500'}`}
                    >
                        {sending ? <ActivityIndicator color="white" size="small" /> : <PaperPlaneRight color="white" size={24} weight="fill" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
