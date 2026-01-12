import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    content: text('content'),
    aiSummary: text('ai_summary'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const quizzes = sqliteTable('quizzes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    noteId: integer('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
    questions: text('questions').notNull(), // JSON string
    score: integer('score'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const chats = sqliteTable('chats', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    noteId: integer('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
    messages: text('messages').notNull(), // JSON string of chat history
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type Chat = typeof chats.$inferSelect;
