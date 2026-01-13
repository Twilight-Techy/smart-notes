CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`color` text DEFAULT '#DC2626' NOT NULL,
	`icon` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`messages` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "note_id", "messages", "created_at") SELECT "id", "note_id", "messages", "created_at" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer,
	`title` text NOT NULL,
	`content` text,
	`content_type` text DEFAULT 'text' NOT NULL,
	`file_uri` text,
	`ai_summary` text,
	`ai_concepts` text,
	`topics` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "course_id", "title", "content", "content_type", "file_uri", "ai_summary", "ai_concepts", "topics", "created_at", "updated_at") SELECT "id", "course_id", "title", "content", "content_type", "file_uri", "ai_summary", "ai_concepts", "topics", "created_at", "updated_at" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
CREATE TABLE `__new_quizzes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`topic` text,
	`questions` text NOT NULL,
	`score` integer,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_quizzes`("id", "note_id", "topic", "questions", "score", "completed_at", "created_at") SELECT "id", "note_id", "topic", "questions", "score", "completed_at", "created_at" FROM `quizzes`;--> statement-breakpoint
DROP TABLE `quizzes`;--> statement-breakpoint
ALTER TABLE `__new_quizzes` RENAME TO `quizzes`;