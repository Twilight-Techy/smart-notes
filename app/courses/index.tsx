import { db } from '@/db/client';
import type { Course } from '@/db/schema';
import { courses } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { eq } from 'drizzle-orm';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PRESET_COLORS = [
    '#DC2626', // Ruby red
    '#EA580C', // Orange
    '#D97706', // Amber
    '#65A30D', // Lime
    '#059669', // Emerald
    '#0891B2', // Cyan
    '#2563EB', // Blue
    '#7C3AED', // Violet
    '#C026D3', // Fuchsia
];

export default function CourseManagement() {
    const router = useRouter();
    const { theme, isDark } = useTheme();

    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formColor, setFormColor] = useState(PRESET_COLORS[0]);

    useFocusEffect(
        useCallback(() => {
            fetchCourses();
        }, [])
    );

    const fetchCourses = async () => {
        const coursesList = await db.select().from(courses);
        setAllCourses(coursesList);
    };

    const handleAdd = () => {
        setFormName('');
        setFormCode('');
        setFormColor(PRESET_COLORS[0]);
        setEditingCourse(null);
        setShowAddModal(true);
    };

    const handleEdit = (course: Course) => {
        setFormName(course.name);
        setFormCode(course.code || '');
        setFormColor(course.color);
        setEditingCourse(course);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert('Error', 'Please enter a course name');
            return;
        }

        try {
            if (editingCourse) {
                await db
                    .update(courses)
                    .set({
                        name: formName.trim(),
                        code: formCode.trim() || null,
                        color: formColor,
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(courses.id, editingCourse.id));
            } else {
                await db.insert(courses).values({
                    name: formName.trim(),
                    code: formCode.trim() || null,
                    color: formColor,
                });
            }
            setShowAddModal(false);
            fetchCourses();
        } catch (error) {
            Alert.alert('Error', 'Failed to save course');
        }
    };

    const handleDelete = async (courseId: number) => {
        Alert.alert(
            'Delete Course',
            'This will unlink all notes from this course. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await db.delete(courses).where(eq(courses.id, courseId));
                        fetchCourses();
                    },
                },
            ]
        );
    };

    if (showAddModal) {
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
                        onPress={() => setShowAddModal(false)}
                    >
                        <ArrowLeft size={20} color={theme.text} />
                    </TouchableOpacity>

                    <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                        {editingCourse ? 'Edit Course' : 'New Course'}
                    </Text>

                    <TouchableOpacity
                        className="px-4 py-2 rounded-xl"
                        style={{ backgroundColor: theme.primary }}
                        onPress={handleSave}
                    >
                        <Text className="font-semibold" style={{ color: '#FFFFFF' }}>
                            Save
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">
                    {/* Course Name */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
                            Course Name *
                        </Text>
                        <TextInput
                            className="px-4 py-3 rounded-xl text-base"
                            style={{
                                backgroundColor: theme.surface,
                                color: theme.text,
                            }}
                            placeholder="e.g., Introduction to Computer Science"
                            placeholderTextColor={theme.textSecondary}
                            value={formName}
                            onChangeText={setFormName}
                        />
                    </View>

                    {/* Course Code */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold mb-2" style={{ color: theme.textSecondary }}>
                            Course Code (Optional)
                        </Text>
                        <TextInput
                            className="px-4 py-3 rounded-xl text-base"
                            style={{
                                backgroundColor: theme.surface,
                                color: theme.text,
                            }}
                            placeholder="e.g., CS101"
                            placeholderTextColor={theme.textSecondary}
                            value={formCode}
                            onChangeText={setFormCode}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Color Picker */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                            Color
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {PRESET_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    className="w-12 h-12 rounded-full items-center justify-center"
                                    style={{
                                        backgroundColor: color,
                                        borderWidth: formColor === color ? 3 : 0,
                                        borderColor: theme.background,
                                    }}
                                    onPress={() => setFormColor(color)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Preview */}
                    <View className="mb-6">
                        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
                            Preview
                        </Text>
                        <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
                            <View className="flex-row items-center">
                                <View
                                    className="w-1 h-8 rounded-full mr-3"
                                    style={{ backgroundColor: formColor }}
                                />
                                <View>
                                    <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                                        {formName || 'Course Name'}
                                    </Text>
                                    {formCode && (
                                        <Text className="text-sm" style={{ color: theme.textSecondary }}>
                                            {formCode}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: theme.background }}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View className="px-6 pt-14 pb-6" style={{ backgroundColor: theme.surface }}>
                <Text className="text-3xl font-bold" style={{ color: theme.text }}>
                    Courses
                </Text>
                <Text className="text-sm mt-2" style={{ color: theme.textSecondary }}>
                    Organize your notes by course
                </Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {allCourses.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Text className="text-lg text-center" style={{ color: theme.textSecondary }}>
                            No courses yet
                        </Text>
                        <Text className="text-sm mt-2 text-center" style={{ color: theme.textTertiary }}>
                            Tap + to create your first course
                        </Text>
                    </View>
                ) : (
                    allCourses.map((course) => (
                        <View
                            key={course.id}
                            className="mb-3 p-4 rounded-xl flex-row items-center"
                            style={{ backgroundColor: theme.surface }}
                        >
                            <View className="w-1 h-12 rounded-full mr-3" style={{ backgroundColor: course.color }} />
                            <View className="flex-1">
                                <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                                    {course.name}
                                </Text>
                                {course.code && (
                                    <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                                        {course.code}
                                    </Text>
                                )}
                            </View>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    className="w-10 h-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: theme.surfaceVariant }}
                                    onPress={() => handleEdit(course)}
                                >
                                    <Edit size={18} color={theme.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="w-10 h-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: theme.surfaceVariant }}
                                    onPress={() => handleDelete(course.id)}
                                >
                                    <Trash2 size={18} color={theme.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                className="absolute bottom-8 right-6 w-16 h-16 rounded-2xl items-center justify-center shadow-lg"
                style={{ backgroundColor: theme.primary }}
                onPress={handleAdd}
            >
                <Plus size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}
