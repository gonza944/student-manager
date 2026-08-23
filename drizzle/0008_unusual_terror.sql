ALTER TABLE `user` ADD `time_zone` text DEFAULT 'America/Argentina/Cordoba' NOT NULL;--> statement-breakpoint
ALTER TABLE `student` ADD `student_since` text;--> statement-breakpoint
UPDATE `student`
SET `student_since` = strftime('%Y-%m-%d', `created_at` / 1000.0, 'unixepoch', '-3 hours');--> statement-breakpoint
CREATE TRIGGER `student_since_required_on_insert`
BEFORE INSERT ON `student`
WHEN NEW.`student_since` IS NULL
BEGIN
	SELECT RAISE(ABORT, 'student.student_since is required');
END;--> statement-breakpoint
CREATE TRIGGER `student_since_required_on_update`
BEFORE UPDATE OF `student_since` ON `student`
WHEN NEW.`student_since` IS NULL
BEGIN
	SELECT RAISE(ABORT, 'student.student_since is required');
END;--> statement-breakpoint
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
