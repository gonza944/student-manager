import assert from "node:assert/strict";
import test from "node:test";

import {
  classAvailabilityInputSchema,
  createStudentClassInputSchema,
  setStudentClassStatusInputSchema,
  studentClassPageInputSchema,
  updateStudentClassInputSchema,
} from "../../lib/classes/contracts";

test("validates class creation and editing inputs", () => {
  assert.equal(
    createStudentClassInputSchema.safeParse({
      studentId: "student-1",
      scheduledAt: "2026-09-22T15:00:00.000Z",
      durationMinutes: 35,
    }).success,
    true,
  );
  assert.equal(
    createStudentClassInputSchema.safeParse({
      studentId: "bad id",
      scheduledAt: "tomorrow",
      durationMinutes: 31,
    }).success,
    false,
  );
  assert.equal(
    updateStudentClassInputSchema.safeParse({
      studentId: "student-1",
      classId: "class-1",
      scheduledAt: "2026-09-22T15:00:00.000Z",
      durationMinutes: 60,
      chargeMinor: -1,
    }).success,
    false,
  );
});

test("limits lifecycle changes and validates availability dates", () => {
  assert.equal(
    setStudentClassStatusInputSchema.safeParse({
      studentId: "student-1",
      classId: "class-1",
      status: "completed",
    }).success,
    true,
  );
  assert.equal(
    setStudentClassStatusInputSchema.safeParse({
      studentId: "student-1",
      classId: "class-1",
      status: "scheduled",
    }).success,
    false,
  );
  assert.equal(
    classAvailabilityInputSchema.safeParse({
      localDate: "2026-02-30",
    }).success,
    false,
  );
});

test("requires stable timeline cursors", () => {
  assert.equal(
    studentClassPageInputSchema.safeParse({
      studentId: "student-1",
      direction: "earlier",
      cursor: {
        scheduledAt: "2026-09-22T15:00:00.000Z",
        id: "class-1",
      },
    }).success,
    true,
  );
  assert.equal(
    studentClassPageInputSchema.safeParse({
      studentId: "student-1",
      direction: "sideways",
      cursor: null,
    }).success,
    false,
  );
});
