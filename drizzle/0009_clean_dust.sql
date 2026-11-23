CREATE TABLE `student_class` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`student_id` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`hourly_rate_snapshot_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`charge_minor` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "student_class_duration_valid" CHECK("student_class"."duration_minutes" > 0 AND "student_class"."duration_minutes" % 5 = 0),
	CONSTRAINT "student_class_hourly_rate_positive" CHECK("student_class"."hourly_rate_snapshot_minor" > 0),
	CONSTRAINT "student_class_charge_nonnegative" CHECK("student_class"."charge_minor" >= 0),
	CONSTRAINT "student_class_status_valid" CHECK("student_class"."status" IN ('scheduled', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `student_class_teacher_scheduled_idx` ON `student_class` (`teacher_id`,`scheduled_at`,`id`);--> statement-breakpoint
CREATE INDEX `student_class_teacher_student_scheduled_idx` ON `student_class` (`teacher_id`,`student_id`,`scheduled_at`,`id`);--> statement-breakpoint
CREATE TRIGGER `student_class_teacher_matches_student_on_insert`
BEFORE INSERT ON `student_class`
WHEN NOT EXISTS (
	SELECT 1 FROM `student`
	WHERE `student`.`id` = NEW.`student_id`
		AND `student`.`teacher_id` = NEW.`teacher_id`
)
BEGIN
	SELECT RAISE(ABORT, 'student_class teacher does not own student');
END;--> statement-breakpoint
CREATE TRIGGER `student_class_teacher_matches_student_on_update`
BEFORE UPDATE OF `teacher_id`, `student_id` ON `student_class`
WHEN NOT EXISTS (
	SELECT 1 FROM `student`
	WHERE `student`.`id` = NEW.`student_id`
		AND `student`.`teacher_id` = NEW.`teacher_id`
)
BEGIN
	SELECT RAISE(ABORT, 'student_class teacher does not own student');
END;--> statement-breakpoint
CREATE TRIGGER `student_class_snapshot_immutable`
BEFORE UPDATE OF `hourly_rate_snapshot_minor`, `currency` ON `student_class`
WHEN NEW.`hourly_rate_snapshot_minor` <> OLD.`hourly_rate_snapshot_minor`
	OR NEW.`currency` <> OLD.`currency`
BEGIN
	SELECT RAISE(ABORT, 'student_class rate snapshot is immutable');
END;--> statement-breakpoint
CREATE TRIGGER `student_class_no_overlap_on_insert`
BEFORE INSERT ON `student_class`
WHEN NEW.`status` IN ('scheduled', 'completed')
	AND EXISTS (
		SELECT 1 FROM `student_class` AS `existing`
		WHERE `existing`.`teacher_id` = NEW.`teacher_id`
			AND `existing`.`status` IN ('scheduled', 'completed')
			AND `existing`.`scheduled_at` < NEW.`scheduled_at` + NEW.`duration_minutes` * 60000
			AND NEW.`scheduled_at` < `existing`.`scheduled_at` + `existing`.`duration_minutes` * 60000
	)
BEGIN
	SELECT RAISE(ABORT, 'student_class interval overlaps an existing class');
END;--> statement-breakpoint
CREATE TRIGGER `student_class_no_overlap_on_update`
BEFORE UPDATE OF `teacher_id`, `scheduled_at`, `duration_minutes`, `status` ON `student_class`
WHEN NEW.`status` IN ('scheduled', 'completed')
	AND EXISTS (
		SELECT 1 FROM `student_class` AS `existing`
		WHERE `existing`.`id` <> NEW.`id`
			AND `existing`.`teacher_id` = NEW.`teacher_id`
			AND `existing`.`status` IN ('scheduled', 'completed')
			AND `existing`.`scheduled_at` < NEW.`scheduled_at` + NEW.`duration_minutes` * 60000
			AND NEW.`scheduled_at` < `existing`.`scheduled_at` + `existing`.`duration_minutes` * 60000
	)
BEGIN
	SELECT RAISE(ABORT, 'student_class interval overlaps an existing class');
END;
