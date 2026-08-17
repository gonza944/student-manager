import assert from "node:assert/strict";
import test from "node:test";

import {
  addDateOnlyDays,
  buildStudentRateHistoryPage,
  buildStudentRateTimeline,
  createRateSnapshot,
  getZonedDateStart,
  hasRateChanged,
  recalculateStudentRateHistoryEntries,
  resolveRatePeriod,
  type StoredRateHistoryEntry,
} from "../../lib/students/rate-history";

function historyEntry(
  id: string,
  effectiveAt: string,
  grossRateMinor: number,
  sequence = 0,
): StoredRateHistoryEntry {
  return {
    id,
    sequence,
    ...createRateSnapshot(grossRateMinor, "preply", 1_800),
    effectiveAt: new Date(effectiveAt),
  };
}

test("creates snapshots with integer-based Direct and Preply fees", () => {
  assert.deepEqual(createRateSnapshot(1_000, "private", 1_800), {
    grossRateMinor: 1_000,
    feeBps: 485,
    feeAmountMinor: 49,
    netRateMinor: 951,
    source: "private",
  });
  assert.deepEqual(createRateSnapshot(1_000, "private", 1_800, 650), {
    grossRateMinor: 1_000,
    feeBps: 650,
    feeAmountMinor: 65,
    netRateMinor: 935,
    source: "private",
  });
  assert.deepEqual(createRateSnapshot(2_500, "preply", 1_800), {
    grossRateMinor: 2_500,
    feeBps: 1_800,
    feeAmountMinor: 450,
    netRateMinor: 2_050,
    source: "preply",
  });
});

test("uses insertion order when changes share a timestamp", () => {
  const effectiveAt = "2026-01-01T00:00:00.000Z";
  const timeline = buildStudentRateTimeline([
    historyEntry("ffff", effectiveAt, 2_000, 1),
    historyEntry("0000", effectiveAt, 3_000, 2),
  ]);

  assert.equal(timeline.current.id, "0000");
  assert.equal(timeline.current.grossMinor, 3_000);
});

test("detects gross, source, and applicable fee changes", () => {
  const preply = createRateSnapshot(2_500, "preply", 1_800);

  assert.equal(hasRateChanged(preply, preply), false);
  assert.equal(
    hasRateChanged(
      preply,
      createRateSnapshot(2_600, "preply", 1_800),
    ),
    true,
  );
  assert.equal(
    hasRateChanged(
      preply,
      createRateSnapshot(2_500, "private", 1_800),
    ),
    true,
  );
  assert.equal(
    hasRateChanged(
      preply,
      createRateSnapshot(2_500, "preply", 2_000),
    ),
    true,
  );

  const direct = createRateSnapshot(2_500, "private", 1_800);
  assert.equal(
    hasRateChanged(
      direct,
      createRateSnapshot(2_500, "private", 2_000),
    ),
    false,
  );
  assert.equal(
    hasRateChanged(
      direct,
      createRateSnapshot(2_500, "private", 1_800, 650),
    ),
    true,
  );
});

test("calculates chronological intervals and differences", () => {
  const day = 24 * 60 * 60 * 1_000;
  const timeline = buildStudentRateTimeline(
    [
      historyEntry("third", "2026-01-31T00:00:00.000Z", 2_250),
      historyEntry("first", "2026-01-01T00:00:00.000Z", 2_000),
      historyEntry("second", "2026-01-11T00:00:00.000Z", 2_500),
    ],
    new Date("2026-02-10T00:00:00.000Z"),
  );

  assert.equal(timeline.current.id, "third");
  assert.equal(timeline.current.durationMs, 10 * day);
  assert.equal(timeline.current.differenceFromPreviousMinor, -205);
  assert.deepEqual(
    timeline.previous.map(({ id }) => id),
    ["second", "first"],
  );
  assert.equal(timeline.previous[0].durationMs, 20 * day);
  assert.equal(timeline.previous[0].differenceFromPreviousMinor, 410);
  assert.equal(timeline.previous[1].durationMs, 10 * day);
  assert.equal(timeline.previous[1].differenceFromPreviousMinor, null);
});

test("keeps one-entry timelines meaningful", () => {
  const timeline = buildStudentRateTimeline(
    [historyEntry("initial", "2026-02-01T00:00:00.000Z", 2_000)],
    new Date("2026-02-02T00:00:00.000Z"),
  );

  assert.equal(timeline.current.id, "initial");
  assert.equal(timeline.current.effectiveUntil, null);
  assert.equal(timeline.previous.length, 0);
});

test("rejects an empty timeline", () => {
  assert.throws(
    () => buildStudentRateTimeline([]),
    /requires at least one entry/,
  );
});

test("resolves student-local date boundaries across time zones", () => {
  assert.equal(
    getZonedDateStart("2026-08-01", "America/Argentina/Cordoba").toISOString(),
    "2026-08-01T03:00:00.000Z",
  );
  assert.equal(
    getZonedDateStart("2026-03-08", "America/New_York").toISOString(),
    "2026-03-08T05:00:00.000Z",
  );
  assert.equal(addDateOnlyDays("2026-02-28", 1), "2026-03-01");
});

test("resolves closed and ongoing retroactive periods", () => {
  const initial = historyEntry(
    "initial",
    "2026-01-01T03:00:00.000Z",
    2_000,
  );
  const now = new Date("2026-08-11T15:00:00.000Z");
  const closed = resolveRatePeriod(
    [initial],
    "2026-03-01",
    "2026-03-31",
    "America/Argentina/Cordoba",
    now,
  );

  assert.equal(closed.ok, true);
  if (!closed.ok) return;
  assert.equal(closed.effectiveAt.toISOString(), "2026-03-01T03:00:00.000Z");
  assert.equal(closed.restoreAt?.toISOString(), "2026-04-01T03:00:00.000Z");
  assert.equal(closed.activeRate.id, "initial");
  assert.equal(closed.hasRestoreBoundary, false);

  const ongoing = resolveRatePeriod(
    [initial],
    "2026-07-01",
    null,
    "America/Argentina/Cordoba",
    now,
  );
  assert.equal(ongoing.ok, true);
  if (ongoing.ok) assert.equal(ongoing.restoreAt, null);
});

test("rejects invalid, overlapping, and before-first rate periods", () => {
  const initial = historyEntry(
    "initial",
    "2026-01-01T03:00:00.000Z",
    2_000,
  );
  const later = historyEntry(
    "later",
    "2026-04-01T03:00:00.000Z",
    2_500,
  );
  const now = new Date("2026-08-11T15:00:00.000Z");
  const timeZone = "America/Argentina/Cordoba";

  assert.deepEqual(
    resolveRatePeriod([initial], "2026-08-12", null, timeZone, now),
    { ok: false, error: "invalidDate" },
  );
  assert.deepEqual(
    resolveRatePeriod(
      [initial],
      "2026-07-01",
      "2026-08-11",
      timeZone,
      now,
    ),
    { ok: false, error: "invalidDate" },
  );
  assert.deepEqual(
    resolveRatePeriod(
      [initial, later],
      "2026-03-01",
      "2026-05-01",
      timeZone,
      now,
    ),
    { ok: false, error: "overlap" },
  );
  assert.deepEqual(
    resolveRatePeriod(
      [initial],
      "2025-12-01",
      "2025-12-31",
      timeZone,
      now,
    ),
    { ok: false, error: "overlap" },
  );
});

test("reuses an existing rate at the restoration boundary", () => {
  const initial = historyEntry(
    "initial",
    "2026-01-01T03:00:00.000Z",
    2_000,
  );
  const following = historyEntry(
    "following",
    "2026-04-01T03:00:00.000Z",
    2_500,
  );
  const period = resolveRatePeriod(
    [initial, following],
    "2026-03-01",
    "2026-03-31",
    "America/Argentina/Cordoba",
    new Date("2026-08-11T15:00:00.000Z"),
  );

  assert.equal(period.ok, true);
  if (period.ok) assert.equal(period.hasRestoreBoundary, true);
});

test("deleting a middle change extends the previous timeline entry", () => {
  const timeline = buildStudentRateTimeline(
    [
      historyEntry("first", "2026-01-01T00:00:00.000Z", 2_000),
      historyEntry("third", "2026-03-01T00:00:00.000Z", 3_000),
    ],
    new Date("2026-04-01T00:00:00.000Z"),
  );

  assert.equal(timeline.previous[0].id, "first");
  assert.equal(timeline.previous[0].effectiveUntil, "2026-03-01T00:00:00.000Z");
});

test("recalculates every displayed boundary after an optimistic deletion", () => {
  const day = 24 * 60 * 60 * 1_000;
  const now = new Date("2026-02-10T00:00:00.000Z");
  const timeline = buildStudentRateTimeline(
    [
      historyEntry("first", "2026-01-01T00:00:00.000Z", 1_000),
      historyEntry("second", "2026-01-11T00:00:00.000Z", 2_000),
      historyEntry("third", "2026-01-21T00:00:00.000Z", 3_000),
      historyEntry("fourth", "2026-01-31T00:00:00.000Z", 4_000),
    ],
    now,
  );
  const entries = [timeline.current, ...timeline.previous];
  const withoutMiddle = recalculateStudentRateHistoryEntries(
    entries.filter(({ id }) => id !== "third"),
    now,
  );

  assert.equal(withoutMiddle[0].differenceFromPreviousMinor, 1_640);
  assert.equal(withoutMiddle[1].effectiveUntil, "2026-01-31T00:00:00.000Z");
  assert.equal(withoutMiddle[1].durationMs, 20 * day);

  const withoutCurrent = recalculateStudentRateHistoryEntries(
    entries.filter(({ id }) => id !== "fourth"),
    now,
  );
  assert.equal(withoutCurrent[0].effectiveUntil, null);
  assert.equal(withoutCurrent[0].durationMs, 20 * day);
});

test("paginates rate history without losing boundary calculations", () => {
  const history = Array.from({ length: 45 }, (_, index) =>
    historyEntry(
      `rate-${index}`,
      new Date(Date.UTC(2022, 0, index + 1)).toISOString(),
      1_000 + index * 100,
      index + 1,
    ),
  );
  const firstPage = buildStudentRateHistoryPage(
    history,
    20,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
  );

  assert.equal(firstPage.entries.length, 20);
  assert.equal(firstPage.entries[0].id, "rate-44");
  assert.equal(firstPage.entries.at(-1)?.id, "rate-25");
  assert.deepEqual(firstPage.nextCursor, {
    effectiveAt: history[25].effectiveAt.toISOString(),
    sequence: 26,
  });

  const secondRows = history.filter(
    ({ effectiveAt, sequence }) =>
      effectiveAt.getTime() < history[25].effectiveAt.getTime() ||
      (effectiveAt.getTime() === history[25].effectiveAt.getTime() &&
        sequence < 26),
  );
  const secondPage = buildStudentRateHistoryPage(
    secondRows,
    20,
    history[25].effectiveAt,
  );

  assert.equal(secondPage.entries.length, 20);
  assert.equal(secondPage.entries[0].id, "rate-24");
  assert.equal(
    secondPage.entries[0].effectiveUntil,
    history[25].effectiveAt.toISOString(),
  );
  assert.notEqual(
    secondPage.entries.at(-1)?.differenceFromPreviousMinor,
    null,
  );
  assert.equal(secondPage.entries.at(-1)?.id, "rate-5");
  assert.ok(secondPage.nextCursor);

  const finalPage = buildStudentRateHistoryPage(
    history.slice(0, 5),
    20,
    history[5].effectiveAt,
  );
  assert.equal(finalPage.entries.length, 5);
  assert.equal(finalPage.entries.at(-1)?.id, "rate-0");
  assert.equal(finalPage.entries.at(-1)?.differenceFromPreviousMinor, null);
  assert.equal(finalPage.nextCursor, null);
});
