import {
  calculateStudentRate,
  getDateOnlyToday,
  getStudentCommissionBps,
  type StudentRateHistoryEntry,
  type StudentRateHistoryPage,
  studentRateHistoryPageSchema,
  type StudentRateTimeline,
  studentRateTimelineSchema,
  type studentSources,
} from "./contracts";

type StudentSource = (typeof studentSources)[number];

export type RateSnapshot = {
  grossRateMinor: number;
  feeBps: number;
  feeAmountMinor: number;
  netRateMinor: number;
  source: StudentSource;
};

export type StoredRateHistoryEntry = RateSnapshot & {
  id: string;
  sequence: number;
  effectiveAt: Date;
};

export type RatePeriodResolution =
  | {
      ok: true;
      effectiveAt: Date;
      restoreAt: Date | null;
      activeRate: StoredRateHistoryEntry;
      hasRestoreBoundary: boolean;
    }
  | { ok: false; error: "invalidDate" | "overlap" };

export function addDateOnlyDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getZonedDateStart(value: string, timeZone: string) {
  const [year, month, day] = value.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let instant = target;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .map(({ type, value: part }) => [type, part]),
    );
    const offset =
      Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
      ) - instant;
    instant = target - offset;
  }

  return new Date(instant);
}

export function resolveRatePeriod(
  history: StoredRateHistoryEntry[],
  startDate: string,
  endDate: string | null,
  timeZone: string,
  now = new Date(),
): RatePeriodResolution {
  const today = getDateOnlyToday(timeZone, now);
  if (
    !today ||
    startDate > today ||
    (endDate !== null && (endDate < startDate || endDate >= today))
  ) {
    return { ok: false, error: "invalidDate" };
  }

  const chronological = [...history].sort(
    (left, right) =>
      left.effectiveAt.getTime() - right.effectiveAt.getTime() ||
      left.sequence - right.sequence,
  );
  const effectiveAt =
    startDate === today ? now : getZonedDateStart(startDate, timeZone);
  const restoreAt = endDate
    ? getZonedDateStart(addDateOnlyDays(endDate, 1), timeZone)
    : null;
  const effectiveMs = effectiveAt.getTime();
  const restoreMs = restoreAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const activeIndex = chronological.findLastIndex(
    (entry) => entry.effectiveAt.getTime() < effectiveMs,
  );

  if (activeIndex < 0) return { ok: false, error: "overlap" };

  const following = chronological.slice(activeIndex + 1);
  if (
    following.some((entry) => {
      const entryMs = entry.effectiveAt.getTime();
      return entryMs < restoreMs;
    })
  ) {
    return { ok: false, error: "overlap" };
  }

  return {
    ok: true,
    effectiveAt,
    restoreAt,
    activeRate: chronological[activeIndex],
    hasRestoreBoundary: following.some(
      (entry) => entry.effectiveAt.getTime() === restoreMs,
    ),
  };
}

export function createRateSnapshot(
  grossRateMinor: number,
  source: StudentSource,
  preplyCommissionBps: number,
  directCommissionBps?: number,
): RateSnapshot {
  const rates = calculateStudentRate(
    grossRateMinor,
    source,
    preplyCommissionBps,
    directCommissionBps,
  );

  return {
    grossRateMinor: rates.grossMinor,
    feeBps: getStudentCommissionBps(
      source,
      preplyCommissionBps,
      directCommissionBps,
    ),
    feeAmountMinor: rates.platformFeeMinor,
    netRateMinor: rates.netMinor,
    source,
  };
}

export function hasRateChanged(
  previous: RateSnapshot | undefined,
  next: RateSnapshot,
) {
  return (
    !previous ||
    previous.grossRateMinor !== next.grossRateMinor ||
    previous.source !== next.source ||
    previous.feeBps !== next.feeBps
  );
}

export function buildStudentRateTimeline(
  history: StoredRateHistoryEntry[],
  now = new Date(),
): StudentRateTimeline {
  if (history.length === 0) {
    throw new Error("A student rate timeline requires at least one entry.");
  }

  const chronological = [...history].sort(
    (left, right) =>
      left.effectiveAt.getTime() - right.effectiveAt.getTime() ||
      left.sequence - right.sequence,
  );
  const nowMs = now.getTime();
  const entries = chronological.map((entry, index) => {
    const previous = chronological[index - 1];
    const next = chronological[index + 1];
    const effectiveUntilMs = next?.effectiveAt.getTime();

    return {
      id: entry.id,
      grossMinor: entry.grossRateMinor,
      feeBps: entry.feeBps,
      feeMinor: entry.feeAmountMinor,
      netMinor: entry.netRateMinor,
      source: entry.source,
      effectiveAt: entry.effectiveAt.toISOString(),
      effectiveUntil: next ? next.effectiveAt.toISOString() : null,
      durationMs: Math.max(
        0,
        (effectiveUntilMs ?? nowMs) - entry.effectiveAt.getTime(),
      ),
      differenceFromPreviousMinor: previous
        ? entry.netRateMinor - previous.netRateMinor
        : null,
    };
  });
  const latest = entries.at(-1)!;

  return studentRateTimelineSchema.parse({
    current: latest,
    previous: entries.slice(0, -1).reverse(),
  });
}

export function buildStudentRateHistoryPage(
  history: StoredRateHistoryEntry[],
  limit: number,
  newerEffectiveAt: Date | null = null,
  now = new Date(),
): StudentRateHistoryPage {
  const ordered = [...history].sort(
    (left, right) =>
      right.effectiveAt.getTime() - left.effectiveAt.getTime() ||
      right.sequence - left.sequence,
  );
  const pageRows = ordered.slice(0, limit);
  const entries = pageRows.map((entry, index) => {
    const newer = index === 0 ? newerEffectiveAt : pageRows[index - 1].effectiveAt;
    const older = ordered[index + 1];
    const effectiveUntilMs = newer?.getTime() ?? now.getTime();

    return {
      id: entry.id,
      grossMinor: entry.grossRateMinor,
      feeBps: entry.feeBps,
      feeMinor: entry.feeAmountMinor,
      netMinor: entry.netRateMinor,
      source: entry.source,
      effectiveAt: entry.effectiveAt.toISOString(),
      effectiveUntil: newer?.toISOString() ?? null,
      durationMs: Math.max(0, effectiveUntilMs - entry.effectiveAt.getTime()),
      differenceFromPreviousMinor: older
        ? entry.netRateMinor - older.netRateMinor
        : null,
    };
  });
  const last = pageRows.at(-1);

  return studentRateHistoryPageSchema.parse({
    entries,
    nextCursor:
      ordered.length > limit && last
        ? {
            effectiveAt: last.effectiveAt.toISOString(),
            sequence: last.sequence,
          }
        : null,
  });
}

export function recalculateStudentRateHistoryEntries(
  entries: StudentRateHistoryEntry[],
  now = new Date(),
) {
  return entries.map((entry, index) => {
    const newer = entries[index - 1];
    const older = entries[index + 1];
    const effectiveUntilMs = newer
      ? new Date(newer.effectiveAt).getTime()
      : now.getTime();

    return {
      ...entry,
      effectiveUntil: newer?.effectiveAt ?? null,
      durationMs: Math.max(
        0,
        effectiveUntilMs - new Date(entry.effectiveAt).getTime(),
      ),
      differenceFromPreviousMinor: older
        ? entry.netMinor - older.netMinor
        : null,
    };
  });
}
