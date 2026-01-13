import { db } from '@/db/client';
import type { Course } from '@/db/schema';
import { courses, notes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Save, Scan, Upload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NoteCreator() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const isNew = id === 'new';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        const coursesList = await db.select().from(courses);
        setAllCourses(coursesList);

        if (!isNew) {
            const result = await db.select().from(notes).where(eq(notes.id, Number(id)));
            if (result.length > 0) {
                const note = result[0];
                setTitle(note.title);
                setContent(note.content || '');
                setSelectedCourseId(note.courseId);
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                const result = await db.insert(notes).values({
                    title: title.trim(),
                    content: content.trim(),
                    courseId: selectedCourseId,
                    contentType: 'text',
                }).returning();
                // Navigate to detail view of new note
                if (result.length > 0) {
                    router.replace(`/note/detail-${result[0].id}`);
                } else {
                    router.back();
                }
            } else {
                await db
                    .update(notes)
                    .set({
                        title: title.trim(),
                        content: content.trim(),
                        courseId: selectedCourseId,
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(notes.id, Number(id)));
                router.back();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save note');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

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

                <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                    {isNew ? 'New Note' : 'Edit Note'}
                </Text>

                <TouchableOpacity
                    className="w-10 h-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: saving ? theme.surfaceVariant : theme.primary }}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Save size={20} color={saving ? theme.text : '#FFFFFF'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Course Selector */}
                <View className="mb-6">
                    <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                        Course (Optional)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        <TouchableOpacity
                            className="px-4 py-2 rounded-lg mr-2"
                            style={{
                                backgroundColor:
                                    selectedCourseId === null ? theme.primary : theme.surfaceVariant,
                            }}
                            onPress={() => setSelectedCourseId(null)}
                        >
                            <Text
                                className="font-medium"
                                style={{ color: selectedCourseId === null ? '#FFFFFF' : theme.text }}
                            >
                                None
                            </Text>
                        </TouchableOpacity>
                        {allCourses.map((course) => (
                            <TouchableOpacity
                                key={course.id}
                                className="px-4 py-2 rounded-lg mr-2 flex-row items-center"
                                style={{
                                    backgroundColor:
                                        selectedCourseId === course.id ? course.color : theme.surfaceVariant,
                                }}
                                onPress={() => setSelectedCourseId(course.id)}
                            >
                                <Text
                                    className="font-medium"
                                    style={{ color: selectedCourseId === course.id ? '#FFFFFF' : theme.text }}
                                >
                                    {course.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Title Input */}
                <View className="mb-6">
                    <TextInput
                        className="text-3xl font-bold"
                        style={{ color: theme.text }}
                        placeholder="Note Title"
                        placeholderTextColor={theme.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Content Input */}
                <View className="mb-6">
                    <TextInput
                        className="text-base leading-7"
                        style={{ color: theme.text, minHeight: 400 }}
                        placeholder="Start writing your note..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        textAlignVertical="top"
                        value={content}
                        onChangeText={setContent}
                    />
                </View>

                {/* Additional Options */}
                <View className="flex-row gap-3 mb-6">
                    <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
                        style={{ backgroundColor: theme.surfaceVariant }}
                        onPress={() => {
                            Alert.alert('Coming Soon', 'Document scanning feature');
                        }}
                    >
                        <Scan size={20} color={theme.text} />
                        <Text className="ml-2 font-semibold" style={{ color: theme.text }}>
                            Scan
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center py-4 rounded-xl"
                        style={{ backgroundColor: theme.surfaceVariant }}
                        onPress={() => {
                            Alert.alert('Coming Soon', 'File upload feature');
                        }}
                    >
                        <Upload size={20} color={theme.text} />
                        <Text className="ml-2 font-semibold" style={{ color: theme.text }}>
                            Upload
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
