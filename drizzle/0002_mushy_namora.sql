UPDATE `student`
SET `preferences` = (
  SELECT coalesce(
    json_group_array(
      coalesce(json_extract(value, '$.label'), json_extract(value, '$.key'))
    ),
    '[]'
  )
  FROM json_each(`student`.`preferences`)
)
WHERE json_type(`preferences`, '$[0]') = 'object';
--> statement-breakpoint
UPDATE `student`
SET `interests` = (
  SELECT coalesce(
    json_group_array(
      coalesce(json_extract(value, '$.label'), json_extract(value, '$.key'))
    ),
    '[]'
  )
  FROM json_each(`student`.`interests`)
)
WHERE json_type(`interests`, '$[0]') = 'object';
--> statement-breakpoint
ALTER TABLE `student` DROP COLUMN `contact_details`;
