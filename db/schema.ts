import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Courses table for organizing notes
export const courses = sqliteTable('courses', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    code: text('code'), // e.g., "CS101"
    color: text('color').notNull().default('#DC2626'), // Ruby red
    icon: text('icon'), // Lucide icon name
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

// Notes table with enhanced fields for educational content
export const notes = sqliteTable('notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    content: text('content'), // Main content (markdown/plain text)
    contentType: text('content_type').notNull().default('text'), // 'text' | 'pdf' | 'image' | 'document'
    fileUri: text('file_uri'), // Local file path for attachments
    aiSummary: text('ai_summary'), // Generated key points
    aiConcepts: text('ai_concepts'), // JSON array of concepts
    topics: text('topics'), // JSON array of identified topics
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

// Chats table for note Q&A
export const chats = sqliteTable('chats', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    noteId: integer('note_id')
        .notNull()
        .references(() => notes.id, { onDelete: 'cascade' }),
    messages: text('messages').notNull().default('[]'), // JSON array
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

// Quizzes table with topic-based questions
export const quizzes = sqliteTable('quizzes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    noteId: integer('note_id')
        .notNull()
        .references(() => notes.id, { onDelete: 'cascade' }),
    topic: text('topic'), // Specific topic or 'all'
    questions: text('questions').notNull(), // JSON array of question objects
    score: integer('score'), // Percentage
    completedAt: text('completed_at'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type Course = typeof courses.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
