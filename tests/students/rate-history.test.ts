import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudentRateTimeline,
  createRateSnapshot,
  hasRateChanged,
  type StoredRateHistoryEntry,
} from "../../lib/students/rate-history";

function historyEntry(
  id: string,
  effectiveAt: string,
  grossRateMinor: number,
): StoredRateHistoryEntry {
  return {
    id,
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
