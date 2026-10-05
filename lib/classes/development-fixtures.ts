import type { StudentClassDto } from "./contracts";

const DAY_MS = 24 * 60 * 60 * 1_000;

function atUtcHour(now: Date, dayOffset: number, hour: number) {
  const date = new Date(now.getTime() + dayOffset * DAY_MS);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function getDevelopmentStudentClasses(
  studentId: string,
  studentName: string,
  currency: StudentClassDto["currency"],
  now = new Date(),
): StudentClassDto[] {
  const createdAt = atUtcHour(now, -30, 12);

  return [
    {
      id: "preview-completed",
      studentId,
      studentName,
      scheduledAt: atUtcHour(now, -7, 14),
      durationMinutes: 60,
      hourlyRateSnapshotMinor: 2_400,
      currency,
      chargeMinor: 2_400,
      status: "completed",
      createdAt,
      updatedAt: atUtcHour(now, -7, 15),
    },
    {
      id: "preview-cancelled",
      studentId,
      studentName,
      scheduledAt: atUtcHour(now, -2, 18),
      durationMinutes: 45,
      hourlyRateSnapshotMinor: 2_400,
      currency,
      chargeMinor: 1_800,
      status: "cancelled",
      createdAt,
      updatedAt: atUtcHour(now, -2, 12),
    },
    {
      id: "preview-scheduled",
      studentId,
      studentName,
      scheduledAt: atUtcHour(now, 3, 16),
      durationMinutes: 60,
      hourlyRateSnapshotMinor: 2_400,
      currency,
      chargeMinor: 2_400,
      status: "scheduled",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}
