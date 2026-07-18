CREATE TABLE `student` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`nationality_code` text NOT NULL,
	`time_zone` text NOT NULL,
	`preferred_contact_channel` text NOT NULL,
	`contact_details` text,
	`level` text NOT NULL,
	`preferences` text DEFAULT '[]' NOT NULL,
	`interests` text DEFAULT '[]' NOT NULL,
	`learning_goals` text,
	`source` text NOT NULL,
	`hourly_rate_minor` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`avatar_key` text NOT NULL,
	`theme_color` text NOT NULL,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "student_hourly_rate_positive" CHECK("student"."hourly_rate_minor" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_teacher_email_unique` ON `student` (`teacher_id`,`email`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_updated_idx` ON `student` (`teacher_id`,`deleted_at`,`is_active`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_name_idx` ON `student` (`teacher_id`,`deleted_at`,`is_active`,`normalized_name`,`id`);--> statement-breakpoint
CREATE TABLE `teacher_tag_suggestion` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`normalized_label` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_tag_suggestion_unique` ON `teacher_tag_suggestion` (`teacher_id`,`kind`,`normalized_label`);--> statement-breakpoint
CREATE INDEX `teacher_tag_suggestion_teacher_kind_idx` ON `teacher_tag_suggestion` (`teacher_id`,`kind`);--> statement-breakpoint
ALTER TABLE `user` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `preply_commission_bps` integer DEFAULT 1800 NOT NULL;
