import {
  calculateStudentRate,
  getStudentCommissionBps,
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
  effectiveAt: Date;
};

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
      left.id.localeCompare(right.id),
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
