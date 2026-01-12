import { Note } from '@/db/schema';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
// I'll use simple Intl for now to avoid dep if possible, or just add date-fns. date-fns is great.
// I'll stick to simple JS Copy for date for now.

type NoteCardProps = {
    note: Note;
};

export default function NoteCard({ note }: NoteCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/note/${note.id}`)}
            className="mb-4 rounded-2xl overflow-hidden shadow-sm"
        >
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                className="p-5 border border-white/10"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-white font-bold text-lg flex-1 mr-2" numberOfLines={1}>
                        {note.title || 'Untitled Note'}
                    </Text>
                    {note.aiSummary && <View className="w-2 h-2 rounded-full bg-blue-400 mt-2" />}
                </View>

                <Text className="text-gray-400 text-sm mb-4 leading-5" numberOfLines={3}>
                    {note.aiSummary || note.content || 'No content'}
                </Text>

                <Text className="text-gray-500 text-xs">
                    {new Date(note.createdAt).toLocaleDateString()}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}
