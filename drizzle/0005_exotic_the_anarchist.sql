UPDATE `student`
SET `preferred_contact_channel` = 'other'
WHERE (`preferred_contact_channel` = 'email' AND nullif(trim(`email`), '') IS NULL)
  OR (`preferred_contact_channel` IN ('phone', 'whatsapp') AND nullif(trim(`phone`), '') IS NULL);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_student` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`email` text,
	`phone` text,
	`birth_date` text,
	`nationality_code` text NOT NULL,
	`time_zone` text NOT NULL,
	`preferred_contact_channel` text NOT NULL,
	`level` text NOT NULL,
	`preferences` text DEFAULT '[]' NOT NULL,
	`interests` text DEFAULT '[]' NOT NULL,
	`learning_goals` text,
	`source` text NOT NULL,
	`hourly_rate_minor` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`avatar_key` text NOT NULL,
	`theme_color` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "student_hourly_rate_positive" CHECK("__new_student"."hourly_rate_minor" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_student`("id", "teacher_id", "name", "normalized_name", "email", "phone", "nationality_code", "time_zone", "preferred_contact_channel", "level", "preferences", "interests", "learning_goals", "source", "hourly_rate_minor", "is_active", "avatar_key", "theme_color", "created_at", "updated_at") SELECT "id", "teacher_id", "name", "normalized_name", "email", "phone", "nationality_code", "time_zone", "preferred_contact_channel", "level", "preferences", "interests", "learning_goals", "source", "hourly_rate_minor", "is_active", "avatar_key", "theme_color", "created_at", "updated_at" FROM `student`;--> statement-breakpoint
DROP TABLE `student`;--> statement-breakpoint
ALTER TABLE `__new_student` RENAME TO `student`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `student_teacher_email_unique` ON `student` (`teacher_id`,`email`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_updated_idx` ON `student` (`teacher_id`,`is_active`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_name_idx` ON `student` (`teacher_id`,`is_active`,`normalized_name`,`id`);
