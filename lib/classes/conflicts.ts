export function isScheduleConflict(error: unknown): boolean {
  return error instanceof Error &&
    (error.message.includes("student_class interval overlaps an existing class") ||
      isScheduleConflict(error.cause));
}
