DELETE FROM `student` WHERE `deleted_at` IS NOT NULL;--> statement-breakpoint
DROP INDEX `student_teacher_status_updated_idx`;--> statement-breakpoint
DROP INDEX `student_teacher_status_name_idx`;--> statement-breakpoint
CREATE INDEX `student_teacher_status_updated_idx` ON `student` (`teacher_id`,`is_active`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `student_teacher_status_name_idx` ON `student` (`teacher_id`,`is_active`,`normalized_name`,`id`);--> statement-breakpoint
ALTER TABLE `student` DROP COLUMN `deleted_at`;
