import { NOTE_TYPES, NoteContentType } from '@/constants/Colors';
import { db } from '@/db/client';
import type { Course, Note } from '@/db/schema';
import { courses, notes } from '@/db/schema';
import { useTheme } from '@/hooks/useTheme';
import { desc } from 'drizzle-orm';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BookOpen,
  FileText,
  FileType,
  FolderOpen,
  Image,
  Plus,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const NoteTypeIcon = ({ type, size, color }: { type: string; size: number; color: string }) => {
  switch (type) {
    case 'pdf':
      return <FileType size={size} color={color} />;
    case 'document':
      return <FileText size={size} color={color} />;
    case 'image':
      return <Image size={size} color={color} />;
    default:
      return <FileText size={size} color={color} />;
  }
};

export default function Library() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<NoteContentType | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    const notesList = await db.select().from(notes).orderBy(desc(notes.updatedAt));
    const coursesList = await db.select().from(courses);
    setAllNotes(notesList);
    setAllCourses(coursesList);
  };

  const filteredNotes = allNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === null || note.courseId === selectedCourse;
    const matchesType = selectedType === null || note.contentType === selectedType;
    return matchesSearch && matchesCourse && matchesType;
  });

  const getCourseForNote = (courseId: number | null) => {
    if (!courseId) return null;
    return allCourses.find(c => c.id === courseId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return theme.typePdf;
      case 'document': return theme.typeWord;
      case 'image': return theme.typeImage;
      default: return theme.typeText;
    }
  };

  const activeFiltersCount = (selectedCourse !== null ? 1 : 0) + (selectedType !== null ? 1 : 0);

  const clearFilters = () => {
    setSelectedCourse(null);
    setSelectedType(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Decorative gradient background */}
      <View
        className="absolute top-0 left-0 right-0 h-64 opacity-30"
        style={{
          backgroundColor: theme.primary,
          borderBottomLeftRadius: 100,
          borderBottomRightRadius: 100,
        }}
      />

      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-sm font-medium" style={{ color: theme.accent }}>
              Welcome back
            </Text>
            <Text className="text-3xl font-bold mt-1" style={{ color: theme.text }}>
              Ruby Notes
            </Text>
          </View>

          <TouchableOpacity
            className="w-12 h-12 items-center justify-center rounded-2xl shadow-sm"
            style={{ backgroundColor: theme.surface }}
            onPress={() => router.push('/courses')}
          >
            <FolderOpen size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row gap-3">
          <View
            className="flex-1 flex-row items-center px-4 py-3 rounded-2xl shadow-sm"
            style={{ backgroundColor: theme.surface }}
          >
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: theme.text }}
              placeholder="Search notes..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            className="w-12 h-12 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: activeFiltersCount > 0 ? theme.primary : theme.surface,
            }}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={20} color={activeFiltersCount > 0 ? theme.textOnPrimary : theme.primary} />
            {activeFiltersCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.accent }}
              >
                <Text className="text-xs font-bold" style={{ color: '#FFF' }}>
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-2">
              {selectedCourse !== null && (
                <TouchableOpacity
                  className="flex-row items-center px-3 py-2 rounded-full"
                  style={{ backgroundColor: theme.surfaceVariant }}
                  onPress={() => setSelectedCourse(null)}
                >
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getCourseForNote(selectedCourse)?.color }}
                  />
                  <Text className="text-sm font-medium mr-1" style={{ color: theme.text }}>
                    {getCourseForNote(selectedCourse)?.name}
                  </Text>
                  <X size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              {selectedType !== null && (
                <TouchableOpacity
                  className="flex-row items-center px-3 py-2 rounded-full"
                  style={{ backgroundColor: theme.surfaceVariant }}
                  onPress={() => setSelectedType(null)}
                >
                  <NoteTypeIcon type={selectedType} size={14} color={getTypeColor(selectedType)} />
                  <Text className="text-sm font-medium mx-2" style={{ color: theme.text }}>
                    {NOTE_TYPES[selectedType]?.label || selectedType}
                  </Text>
                  <X size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{ backgroundColor: theme.primary }}
                onPress={clearFilters}
              >
                <Text className="text-sm font-medium" style={{ color: theme.textOnPrimary }}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Notes Grid */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pb-24">
          {filteredNotes.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
                style={{ backgroundColor: theme.surfaceVariant }}
              >
                <BookOpen size={36} color={theme.primary} />
              </View>
              <Text className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
                No notes found
              </Text>
              <Text className="text-center" style={{ color: theme.textSecondary }}>
                {activeFiltersCount > 0
                  ? 'Try adjusting your filters'
                  : 'Tap + to create your first note'}
              </Text>
            </View>
          ) : (
            filteredNotes.map((note, index) => {
              const course = getCourseForNote(note.courseId);
              const typeColor = getTypeColor(note.contentType);

              return (
                <Pressable
                  key={note.id}
                  className="mb-4 rounded-3xl overflow-hidden"
                  style={{
                    backgroundColor: theme.surface,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                  onPress={() => router.push(`/note/detail-${note.id}`)}
                >
                  {/* Type indicator bar */}
                  <View
                    className="h-1"
                    style={{ backgroundColor: typeColor }}
                  />

                  <View className="p-4">
                    {/* Header row */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        {course && (
                          <View
                            className="flex-row items-center px-2 py-1 rounded-lg mr-2"
                            style={{ backgroundColor: `${course.color}20` }}
                          >
                            <View
                              className="w-2 h-2 rounded-full mr-1.5"
                              style={{ backgroundColor: course.color }}
                            />
                            <Text className="text-xs font-medium" style={{ color: course.color }}>
                              {course.code || course.name}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View
                        className="flex-row items-center px-2 py-1 rounded-lg"
                        style={{ backgroundColor: `${typeColor}15` }}
                      >
                        <NoteTypeIcon type={note.contentType} size={12} color={typeColor} />
                        <Text className="text-xs font-medium ml-1" style={{ color: typeColor }}>
                          {NOTE_TYPES[note.contentType as NoteContentType]?.label || 'Text'}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text className="text-lg font-bold mb-2" style={{ color: theme.text }}>
                      {note.title}
                    </Text>

                    {/* Summary */}
                    {note.aiSummary && (
                      <Text
                        className="text-sm leading-5 mb-3"
                        numberOfLines={2}
                        style={{ color: theme.textSecondary }}
                      >
                        {note.aiSummary}
                      </Text>
                    )}

                    {/* Footer */}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs" style={{ color: theme.textTertiary }}>
                        {new Date(note.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>

                      {note.topics && (
                        <View className="flex-row">
                          {JSON.parse(note.topics).slice(0, 2).map((topic: string, i: number) => (
                            <View
                              key={i}
                              className="px-2 py-1 rounded-md ml-1"
                              style={{ backgroundColor: theme.surfaceVariant }}
                            >
                              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                                {topic}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1 bg-black/50"
            onPress={() => setShowFilters(false)}
          />
          <View
            className="rounded-t-3xl px-6 pt-6 pb-10"
            style={{ backgroundColor: theme.surface }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold" style={{ color: theme.text }}>
                Filters
              </Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Course Filter */}
            <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
              Course
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: selectedCourse === null ? theme.primary : theme.surfaceVariant,
                  }}
                  onPress={() => setSelectedCourse(null)}
                >
                  <Text
                    className="font-medium"
                    style={{ color: selectedCourse === null ? theme.textOnPrimary : theme.text }}
                  >
                    All Courses
                  </Text>
                </TouchableOpacity>
                {allCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    className="flex-row items-center px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: selectedCourse === course.id ? course.color : theme.surfaceVariant,
                    }}
                    onPress={() => setSelectedCourse(course.id)}
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor: selectedCourse === course.id ? '#FFF' : course.color
                      }}
                    />
                    <Text
                      className="font-medium"
                      style={{ color: selectedCourse === course.id ? '#FFF' : theme.text }}
                    >
                      {course.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Type Filter */}
            <Text className="text-sm font-semibold mb-3" style={{ color: theme.textSecondary }}>
              Note Type
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              <TouchableOpacity
                className="px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: selectedType === null ? theme.primary : theme.surfaceVariant,
                }}
                onPress={() => setSelectedType(null)}
              >
                <Text
                  className="font-medium"
                  style={{ color: selectedType === null ? theme.textOnPrimary : theme.text }}
                >
                  All Types
                </Text>
              </TouchableOpacity>
              {(Object.keys(NOTE_TYPES) as NoteContentType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  className="flex-row items-center px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: selectedType === type ? getTypeColor(type) : theme.surfaceVariant,
                  }}
                  onPress={() => setSelectedType(type)}
                >
                  <NoteTypeIcon
                    type={type}
                    size={16}
                    color={selectedType === type ? '#FFF' : getTypeColor(type)}
                  />
                  <Text
                    className="font-medium ml-2"
                    style={{ color: selectedType === type ? '#FFF' : theme.text }}
                  >
                    {NOTE_TYPES[type].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: theme.primary }}
              onPress={() => setShowFilters(false)}
            >
              <Text className="text-lg font-semibold" style={{ color: theme.textOnPrimary }}>
                Show {filteredNotes.length} Notes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-16 h-16 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: theme.primary,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={() => router.push('/note/new')}
      >
        <Plus size={28} color={theme.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}
