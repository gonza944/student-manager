import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateStudentRate,
  studentDtoSchema,
  studentIdInputSchema,
} from "../../lib/students/contracts";

const validStudent = {
  name: "Sofía Martínez",
  email: " SOFIA@EXAMPLE.COM ",
  phone: "",
  nationalityCode: "ar",
  timeZone: "America/Argentina/Cordoba",
  preferredContactChannel: "email" as const,
  contactDetails: null,
  level: "B2" as const,
  preferences: [],
  interests: [],
  learningGoals: "Speak confidently",
  source: "preply" as const,
  hourlyRateMinor: 2_500,
  isActive: true,
  avatarKey: "avatar-01" as const,
  themeColor: "coral" as const,
  id: "student-01",
  rates: {
    grossMinor: 2_500,
    platformFeeMinor: 450,
    netMinor: 2_050,
  },
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

test("normalizes a student DTO", () => {
  const student = studentDtoSchema.parse(validStudent);

  assert.equal(student.email, "sofia@example.com");
  assert.equal(student.phone, null);
  assert.equal(student.nationalityCode, "AR");
});

test("rejects an invalid time zone", () => {
  const result = studentDtoSchema.safeParse({
    ...validStudent,
    timeZone: "Moon/Sea_of_Tranquility",
  });

  assert.equal(result.success, false);
});

test("derives Preply and private rates from teacher settings", () => {
  assert.deepEqual(calculateStudentRate(2_500, "preply", 1_800), {
    grossMinor: 2_500,
    platformFeeMinor: 450,
    netMinor: 2_050,
  });
  assert.deepEqual(calculateStudentRate(2_500, "private", 1_800), {
    grossMinor: 2_500,
    platformFeeMinor: 0,
    netMinor: 2_500,
  });
});

test("accepts deterministic local seed identifiers", () => {
  assert.deepEqual(studentIdInputSchema.parse({
    studentId: "local-seed-student-01",
  }), { studentId: "local-seed-student-01" });
});
