export const completeFinishedClassesSql = `
  UPDATE student_class
  SET status = 'completed', updated_at = MAX(updated_at, ?)
  WHERE status = 'scheduled'
    AND scheduled_at <= ?
    AND scheduled_at + duration_minutes * 60000 <= ?
`;

export async function completeFinishedClasses(
  db: D1Database,
  scheduledTime: number,
) {
  if (!Number.isSafeInteger(scheduledTime) || scheduledTime < 0) {
    throw new Error("Invalid scheduled time");
  }
  const result = await db
    .prepare(completeFinishedClassesSql)
    .bind(scheduledTime, scheduledTime, scheduledTime)
    .run();
  return result.meta.changes;
}

export async function completeClassesOnSchedule(
  controller: Pick<ScheduledController, "scheduledTime" | "cron">,
  env: Pick<CloudflareEnv, "DB">,
) {
  const updatedCount = await completeFinishedClasses(
    env.DB,
    controller.scheduledTime,
  );
  console.info("class-auto-completion", {
    scheduledTime: controller.scheduledTime,
    cron: controller.cron,
    updatedCount,
  });
}
