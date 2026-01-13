import { db } from '@/db/client';
import { chats, courses, notes, quizzes } from '@/db/schema';

export async function seedDatabase() {
    console.log('Clearing existing data...');

    // Clear all existing data (order matters due to foreign keys)
    await db.delete(quizzes);
    await db.delete(chats);
    await db.delete(notes);
    await db.delete(courses);

    console.log('Seeding database...');

    // Insert sample courses
    const courseData = [
        { name: 'Computer Science', code: 'CS101', color: '#2563EB' },
        { name: 'Mathematics', code: 'MATH201', color: '#7C3AED' },
        { name: 'Biology', code: 'BIO150', color: '#059669' },
        { name: 'History', code: 'HIST100', color: '#D97706' },
    ];

    const insertedCourses = await db.insert(courses).values(courseData).returning();

    // Insert sample notes with different types
    const notesData = [
        {
            courseId: insertedCourses[0].id,
            title: 'Introduction to Algorithms',
            content: `An algorithm is a step-by-step procedure for solving a problem. Key concepts include time complexity, space complexity, and Big O notation.

Common Algorithm Types:
- Sorting: QuickSort, MergeSort
- Searching: Binary Search
- Graph: BFS, DFS, Dijkstra's

Time Complexity: O(log n) for Binary Search`,
            contentType: 'text',
            aiSummary: 'Covers fundamental algorithm concepts including time/space complexity, Big O notation, and common algorithm types.',
            aiConcepts: JSON.stringify(['Time Complexity', 'Space Complexity', 'Big O Notation', 'Binary Search', 'QuickSort']),
            topics: JSON.stringify(['Complexity Analysis', 'Sorting', 'Searching']),
        },
        {
            courseId: insertedCourses[0].id,
            title: 'Data Structures Textbook - Chapter 5',
            content: `Data structures chapter covering trees, graphs, and hash tables.`,
            contentType: 'pdf',
            aiSummary: 'PDF textbook chapter on non-linear data structures: trees, graphs, and hash tables.',
            aiConcepts: JSON.stringify(['Binary Trees', 'Hash Tables', 'Graphs', 'AVL Trees']),
            topics: JSON.stringify(['Trees', 'Hash Functions', 'Graph Theory']),
        },
        {
            courseId: insertedCourses[1].id,
            title: 'Calculus Lecture Notes',
            content: `Differential and integral calculus fundamentals. Power Rule: d/dx(x^n) = nx^(n-1). Chain Rule for composite functions.`,
            contentType: 'document',
            aiSummary: 'Lecture notes on calculus covering derivatives, integrals, and key rules like power and chain rules.',
            aiConcepts: JSON.stringify(['Derivatives', 'Integrals', 'Power Rule', 'Chain Rule']),
            topics: JSON.stringify(['Differential Calculus', 'Integral Calculus']),
        },
        {
            courseId: insertedCourses[2].id,
            title: 'Cell Diagram',
            content: `Diagram showing eukaryotic cell structure with labeled organelles.`,
            contentType: 'image',
            aiSummary: 'Visual diagram of eukaryotic cell showing nucleus, mitochondria, ER, and other organelles.',
            aiConcepts: JSON.stringify(['Nucleus', 'Mitochondria', 'Endoplasmic Reticulum']),
            topics: JSON.stringify(['Cell Structure', 'Organelles']),
        },
        {
            courseId: insertedCourses[2].id,
            title: 'Cell Biology Basics',
            content: `Cells are the basic units of life. Two main types: prokaryotic (no nucleus) and eukaryotic (nucleus present).

Key Organelles:
- Nucleus: DNA storage
- Mitochondria: ATP production
- Ribosomes: Protein synthesis`,
            contentType: 'text',
            aiSummary: 'Covers prokaryotic vs eukaryotic cells, key organelles and their functions.',
            aiConcepts: JSON.stringify(['Prokaryotic', 'Eukaryotic', 'Mitochondria', 'Nucleus', 'Ribosomes']),
            topics: JSON.stringify(['Cell Types', 'Organelles', 'Cell Function']),
        },
        {
            courseId: insertedCourses[3].id,
            title: 'World War II Timeline',
            content: `Key events: 1939 invasion of Poland, 1941 Pearl Harbor, 1944 D-Day, 1945 Victory.`,
            contentType: 'text',
            aiSummary: 'Timeline of major World War II events from 1939-1945.',
            aiConcepts: JSON.stringify(['Pearl Harbor', 'D-Day', 'Allied Powers', 'Axis Powers']),
            topics: JSON.stringify(['WWII Events', 'Military History']),
        },
        {
            title: 'Quick Study Notes',
            content: `Miscellaneous notes and reminders for exam preparation.`,
            contentType: 'text',
            aiSummary: 'General study notes and exam reminders.',
            aiConcepts: JSON.stringify(['Study Tips', 'Exam Prep']),
            topics: JSON.stringify(['General']),
        },
    ];

    const insertedNotes = await db.insert(notes).values(notesData).returning();

    // Insert sample chat history
    const chatData = [
        {
            noteId: insertedNotes[0].id,
            messages: JSON.stringify([
                { role: 'user', content: 'What is Big O notation?' },
                { role: 'assistant', content: 'Big O notation describes the upper bound of an algorithm\'s time or space complexity. O(n) means linear, O(log n) means logarithmic, O(n²) means quadratic growth.' },
                { role: 'user', content: 'Give me an example' },
                { role: 'assistant', content: 'Binary search is O(log n). With 1 million elements, it takes ~20 comparisons maximum because each step halves the search space.' },
            ]),
        },
        {
            noteId: insertedNotes[2].id,
            messages: JSON.stringify([
                { role: 'user', content: 'Explain the power rule' },
                { role: 'assistant', content: 'The power rule: d/dx(x^n) = nx^(n-1). Bring down the exponent, multiply, then reduce the power by 1. Example: d/dx(x³) = 3x².' },
            ]),
        },
        {
            noteId: insertedNotes[4].id,
            messages: JSON.stringify([
                { role: 'user', content: 'What do mitochondria do?' },
                { role: 'assistant', content: 'Mitochondria are the "powerhouse of the cell." They produce ATP (adenosine triphosphate) through cellular respiration, providing energy for all cell functions.' },
            ]),
        },
    ];

    await db.insert(chats).values(chatData);

    // Insert sample quizzes with scores
    const quizData = [
        {
            noteId: insertedNotes[0].id,
            topic: 'Complexity Analysis',
            questions: JSON.stringify([
                {
                    type: 'mcq',
                    question: 'What is the time complexity of binary search?',
                    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
                    answer: 'O(log n)',
                    explanation: 'Binary search halves the search space each iteration.',
                },
                {
                    type: 'true-false',
                    question: 'Big O describes the exact running time.',
                    answer: 'False',
                    explanation: 'Big O describes the upper bound/growth rate, not exact time.',
                },
            ]),
            score: 100,
            completedAt: new Date().toISOString(),
        },
        {
            noteId: insertedNotes[4].id,
            topic: 'Cell Types',
            questions: JSON.stringify([
                {
                    type: 'mcq',
                    question: 'Which cell type has a nucleus?',
                    options: ['Prokaryotic', 'Eukaryotic', 'Both', 'Neither'],
                    answer: 'Eukaryotic',
                    explanation: 'Eukaryotic cells have membrane-bound nuclei.',
                },
                {
                    type: 'true-false',
                    question: 'Mitochondria produce ATP.',
                    answer: 'True',
                    explanation: 'Mitochondria are the powerhouse of the cell.',
                },
            ]),
            score: 50,
            completedAt: new Date().toISOString(),
        },
    ];

    await db.insert(quizzes).values(quizData);

    console.log('Database seeded successfully!');
    console.log(`Created: ${insertedCourses.length} courses, ${insertedNotes.length} notes, ${chatData.length} chats, ${quizData.length} quizzes`);
}
