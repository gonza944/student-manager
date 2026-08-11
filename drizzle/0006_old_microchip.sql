CREATE TABLE `student_rate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`gross_rate_minor` integer NOT NULL,
	`fee_bps` integer NOT NULL,
	`fee_amount_minor` integer NOT NULL,
	`net_rate_minor` integer NOT NULL,
	`source` text NOT NULL,
	`effective_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "student_rate_history_gross_positive" CHECK("student_rate_history"."gross_rate_minor" > 0),
	CONSTRAINT "student_rate_history_fee_bps_valid" CHECK("student_rate_history"."fee_bps" >= 0 AND "student_rate_history"."fee_bps" <= 10000),
	CONSTRAINT "student_rate_history_amounts_valid" CHECK("student_rate_history"."fee_amount_minor" >= 0 AND "student_rate_history"."net_rate_minor" = "student_rate_history"."gross_rate_minor" - "student_rate_history"."fee_amount_minor")
);
--> statement-breakpoint
WITH `current_rates` AS (
	SELECT
		`student`.`id` AS `student_id`,
		`student`.`teacher_id`,
		`student`.`hourly_rate_minor` AS `gross_rate_minor`,
		CASE
			WHEN `student`.`source` = 'preply' THEN `user`.`preply_commission_bps`
			ELSE 485
		END AS `fee_bps`,
		`student`.`source`,
		`student`.`created_at` AS `effective_at`
	FROM `student`
	INNER JOIN `user` ON `user`.`id` = `student`.`teacher_id`
)
INSERT INTO `student_rate_history` (
	`id`, `student_id`, `teacher_id`, `gross_rate_minor`, `fee_bps`,
	`fee_amount_minor`, `net_rate_minor`, `source`, `effective_at`
)
SELECT
	`student_id` || '-rate-initial',
	`student_id`,
	`teacher_id`,
	`gross_rate_minor`,
	`fee_bps`,
	CAST((`gross_rate_minor` * `fee_bps` + 5000) / 10000 AS integer),
	`gross_rate_minor` - CAST((`gross_rate_minor` * `fee_bps` + 5000) / 10000 AS integer),
	`source`,
	`effective_at`
FROM `current_rates`;
--> statement-breakpoint
CREATE INDEX `student_rate_history_teacher_student_effective_idx` ON `student_rate_history` (`teacher_id`,`student_id`,`effective_at`,`id`);
