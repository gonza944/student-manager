import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDateInput,
  parseDateInput,
  parseIsoDateOnly,
  toIsoDateOnly,
} from "../../app/students/add/utils/date-only";

test("formats and parses numeric date-only values by locale", () => {
  const date = parseIsoDateOnly("1994-01-13");
  assert.ok(date);

  assert.equal(formatDateInput(date, "en-US"), "01/13/1994");
  assert.equal(formatDateInput(date, "es-AR"), "13/01/1994");
  assert.equal(
    toIsoDateOnly(parseDateInput("01/13/1994", "en-US")!),
    "1994-01-13",
  );
  assert.equal(
    toIsoDateOnly(parseDateInput("13/01/1994", "es-AR")!),
    "1994-01-13",
  );
  assert.equal(parseDateInput("02/29/2023", "en-US"), undefined);
});
