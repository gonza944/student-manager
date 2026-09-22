import {
  addDateOnlyDays,
  getZonedDateStart,
} from "../students/rate-history";

export function isClassIntervalWithinLocalDay(
  scheduledAt: Date,
  durationMinutes: number,
  localDate: string,
  timeZone: string,
) {
  if (
    !Number.isFinite(scheduledAt.getTime()) ||
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes % 5 !== 0
  ) {
    return false;
  }

  const start = scheduledAt.getTime();
  const dayStart = getZonedDateStart(localDate, timeZone).getTime();
  const nextDayStart = getZonedDateStart(
    addDateOnlyDays(localDate, 1),
    timeZone,
  ).getTime();

  return start >= dayStart && start + durationMinutes * 60_000 <= nextDayStart;
}
