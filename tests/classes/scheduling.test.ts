import assert from "node:assert/strict";
import test from "node:test";

import {
  isClassIntervalWithinLocalDay,
  resolveClassInterval,
} from "../../lib/classes/scheduling";

test("keeps intervals inside the selected teacher-local day", () => {
  const date = "2026-09-01";
  const timeZone = "America/Argentina/Cordoba";
  const lastHalfHour = new Date("2026-09-02T02:30:00.000Z");

  assert.equal(
    isClassIntervalWithinLocalDay(lastHalfHour, 30, date, timeZone),
    true,
  );
  assert.equal(
    isClassIntervalWithinLocalDay(lastHalfHour, 35, date, timeZone),
    false,
  );
});

test("uses real DST day boundaries", () => {
  assert.equal(
    isClassIntervalWithinLocalDay(
      new Date("2026-03-09T03:30:00.000Z"),
      30,
      "2026-03-08",
      "America/New_York",
    ),
    true,
  );
  assert.equal(
    isClassIntervalWithinLocalDay(
      new Date("2026-11-01T04:00:00.000Z"),
      1_500,
      "2026-11-01",
      "America/New_York",
    ),
    true,
  );
});

test("rejects intervals before studentSince and across local midnight", () => {
  assert.deepEqual(
    resolveClassInterval(
      new Date("2026-09-01T15:00:00.000Z"),
      60,
      "2026-09-02",
      "America/Argentina/Cordoba",
    ),
    { ok: false, error: "invalidDate" },
  );
  assert.deepEqual(
    resolveClassInterval(
      new Date("2026-09-03T02:30:00.000Z"),
      60,
      "2026-09-01",
      "America/Argentina/Cordoba",
    ),
    { ok: false, error: "invalidInterval" },
  );
});
