ALTER TABLE `user` ADD `time_zone` text DEFAULT 'America/Argentina/Cordoba' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_student` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`email` text,
	`phone` text,
	`birth_date` text,
	`student_since` text NOT NULL,
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
	CONSTRAINT "student_hourly_rate_positive" CHECK("hourly_rate_minor" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_student` (
	`id`, `teacher_id`, `name`, `normalized_name`, `email`, `phone`, `birth_date`,
	`student_since`, `nationality_code`, `time_zone`, `preferred_contact_channel`,
	`level`, `preferences`, `interests`, `learning_goals`, `source`,
	`hourly_rate_minor`, `is_active`, `avatar_key`, `theme_color`, `created_at`, `updated_at`
)
SELECT
	`id`, `teacher_id`, `name`, `normalized_name`, `email`, `phone`, `birth_date`,
	strftime('%Y-%m-%d', `created_at` / 1000.0, 'unixepoch', '-3 hours'),
	`nationality_code`, `time_zone`, `preferred_contact_channel`, `level`,
	`preferences`, `interests`, `learning_goals`, `source`, `hourly_rate_minor`,
	`is_active`, `avatar_key`, `theme_color`, `created_at`, `updated_at`
FROM `student`;--> statement-breakpoint
DROP TABLE `student`;--> statement-breakpoint
ALTER TABLE `__new_student` RENAME TO `student`;--> statement-breakpoint
CREATE UNIQUE INDEX `student_teacher_email_unique` ON `student` (`teacher_id`,`email`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_updated_idx` ON `student` (`teacher_id`,`is_active`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_name_idx` ON `student` (`teacher_id`,`is_active`,`normalized_name`,`id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
UPDATE `student_rate_history`
SET `effective_at` = (
	SELECT CAST(strftime('%s', `student`.`student_since` || 'T03:00:00Z') AS integer) * 1000
	FROM `student`
	WHERE `student`.`id` = `student_rate_history`.`student_id`
)
WHERE `student_rate_history`.`rowid` = (
	SELECT `oldest`.`rowid`
	FROM `student_rate_history` AS `oldest`
	WHERE `oldest`.`student_id` = `student_rate_history`.`student_id`
	ORDER BY `oldest`.`effective_at`, `oldest`.`rowid`
	LIMIT 1
)
AND `student_rate_history`.`effective_at` > (
	SELECT CAST(strftime('%s', `student`.`student_since` || 'T03:00:00Z') AS integer) * 1000
	FROM `student`
	WHERE `student`.`id` = `student_rate_history`.`student_id`
);
