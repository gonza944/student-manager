import type { ClassAvailability } from "./contracts";

export function getClassTimeOptions(
  availability: ClassAvailability,
  durationMinutes: number,
  timeZone: string,
  locale: string,
) {
  if (
    !Number.isSafeInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes % 5 !== 0
  )
    return [];
  const end = Date.parse(availability.dayEnd);
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const options = [];
  for (
    let start = Date.parse(availability.dayStart);
    start + durationMinutes * 60_000 <= end;
    start += 5 * 60_000
  ) {
    const intervalEnd = start + durationMinutes * 60_000;
    const occupied = availability.intervals.some((interval) => {
      const busyStart = Date.parse(interval.scheduledAt);
      return (
        start < busyStart + interval.durationMinutes * 60_000 &&
        intervalEnd > busyStart
      );
    });
    options.push({
      value: new Date(start).toISOString(),
      label: formatter.format(start),
      disabled: occupied,
    });
  }
  return distinguishRepeatedTimes(options, locale);
}

function distinguishRepeatedTimes(
  options: { value: string; label: string; disabled: boolean }[],
  locale: string,
) {
  const counts = new Map<string, number>();
  const occurrences = new Map<string, number>();
  for (const option of options)
    counts.set(option.label, (counts.get(option.label) ?? 0) + 1);
  return options.map((option) => {
    if (counts.get(option.label) === 1) return option;
    const occurrence = (occurrences.get(option.label) ?? 0) + 1;
    occurrences.set(option.label, occurrence);
    return {
      ...option,
      label: `${option.label} (${new Intl.NumberFormat(locale).format(occurrence)})`,
    };
  });
}

export function isClassTimeAvailable(
  day: ClassAvailability,
  start: number,
  end: number,
  allowOverlap = false,
) {
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= Date.parse(day.dayStart) &&
    end <= Date.parse(day.dayEnd) &&
    end > start &&
    (end - start) % 300_000 === 0 &&
    (allowOverlap ||
      !day.intervals.some(
        (interval) =>
          start <
            Date.parse(interval.scheduledAt) +
              interval.durationMinutes * 60_000 &&
          end > Date.parse(interval.scheduledAt),
      ))
  );
}

export function getClassEndTimeOptions(
  day: ClassAvailability,
  scheduledAt: string,
  timeZone: string,
  locale: string,
) {
  const start = Date.parse(scheduledAt);
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const options = [];
  for (
    let end = start + 300_000;
    end <= Date.parse(day.dayEnd);
    end += 300_000
  ) {
    options.push({
      value: new Date(end).toISOString(),
      label: formatter.format(end),
      disabled: !isClassTimeAvailable(day, start, end),
    });
  }
  return distinguishRepeatedTimes(options, locale);
}

export function getClassPreferredTime(
  day: ClassAvailability,
  timeZone: string,
  now = new Date(),
) {
  const start = Date.parse(day.dayStart);
  const end = Date.parse(day.dayEnd);
  if (now.getTime() >= start && now.getTime() < end) return now.getTime();
  if (day.intervals.length)
    return Math.min(
      ...day.intervals.map((interval) => Date.parse(interval.scheduledAt)),
    );
  const hours = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  for (let time = start; time < end; time += 300_000) {
    if (hours.format(time) === "08") return time;
  }
  return start;
}

export function getSelectableClassInterval(
  day: ClassAvailability,
  start: number,
  durationMinutes: number,
  allowOverlap = false,
) {
  for (let duration = durationMinutes; duration >= 5; duration -= 5) {
    const end = start + duration * 60_000;
    if (isClassTimeAvailable(day, start, end, allowOverlap))
      return { start, end };
  }
  return null;
}
