import {
  addDateOnlyDays,
  getZonedDateStart,
} from "../students/rate-history";
import { getDateOnlyToday } from "../students/contracts";

export function getClassDayRange(localDate: string, timeZone: string) {
  return {
    dayStart: getZonedDateStart(localDate, timeZone),
    dayEnd: getZonedDateStart(addDateOnlyDays(localDate, 1), timeZone),
  };
}

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
  const range = getClassDayRange(localDate, timeZone);
  const dayStart = range.dayStart.getTime();
  const nextDayStart = range.dayEnd.getTime();

  return start >= dayStart && start + durationMinutes * 60_000 <= nextDayStart;
}

export function resolveClassInterval(
  scheduledAt: Date,
  durationMinutes: number,
  studentSince: string,
  timeZone: string,
) {
  const localDate = getDateOnlyToday(timeZone, scheduledAt);
  if (!localDate || localDate < studentSince) {
    return { ok: false, error: "invalidDate" } as const;
  }
  if (
    !isClassIntervalWithinLocalDay(
      scheduledAt,
      durationMinutes,
      localDate,
      timeZone,
    )
  ) {
    return { ok: false, error: "invalidInterval" } as const;
  }

  return { ok: true, localDate } as const;
}
