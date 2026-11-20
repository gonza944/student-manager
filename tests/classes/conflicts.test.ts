import assert from "node:assert/strict";
import test from "node:test";
import { isScheduleConflict } from "../../lib/classes/conflicts";

test("recognizes overlap errors wrapped by the database adapter without masking other failures", () => {
  const conflict = new Error("student_class interval overlaps an existing class");
  assert.equal(isScheduleConflict(conflict), true);
  assert.equal(isScheduleConflict(new Error("Failed query", { cause: conflict })), true);
  assert.equal(isScheduleConflict(new Error("Failed query", { cause: new Error("database unavailable") })), false);
  assert.equal(isScheduleConflict(null), false);
});
