export function classTimelineQueryKey(studentId?: string) {
  return studentId === undefined
    ? (["student-classes"] as const)
    : (["student-classes", studentId] as const);
}
