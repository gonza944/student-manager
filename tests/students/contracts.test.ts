import assert from "node:assert/strict";
import test from "node:test";

import {
  getInitialForm,
  initialStudentForm,
} from "../../app/students/add/utils/student-form-model";
import { toMinorUnits } from "../../app/students/utils/to-minor-units";
import {
  studentThemeStyles,
  studentThemeSwatches,
} from "../../app/students/const/student-card-config";
import {
  calculateStudentRate,
  createStudentInputSchema,
  deleteStudentRateInputSchema,
  getDateOnlyToday,
  studentDtoSchema,
  studentIdInputSchema,
  studentListInputSchema,
  updateStudentInputSchema,
  updateStudentRateInputSchema,
  updateCommissionSettingsInputSchema,
} from "../../lib/students/contracts";

const validStudent = {
  name: "Sofía Martínez",
  email: " SOFIA@EXAMPLE.COM ",
  phone: "",
  birthDate: "1992-03-14",
  nationalityCode: "ar",
  timeZone: "America/Argentina/Cordoba",
  preferredContactChannel: "email" as const,
  level: "B2" as const,
  preferences: ["Conversation practice"],
  interests: ["Travel"],
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

test("builds initial form values for add and edit", () => {
  assert.equal(getInitialForm(undefined, 100), initialStudentForm);

  const form = getInitialForm(studentDtoSchema.parse(validStudent), 100);
  assert.equal(form.name, validStudent.name);
  assert.equal(form.phone, "");
  assert.equal(form.birthDate, validStudent.birthDate);
  assert.equal(form.hourlyRate, "25");
});

test("normalizes a student DTO", () => {
  const student = studentDtoSchema.parse(validStudent);

  assert.equal(student.email, "sofia@example.com");
  assert.equal(student.phone, null);
  assert.equal(student.nationalityCode, "AR");
  assert.deepEqual(student.preferences, ["Conversation practice"]);
});

test("normalizes the input used to create a student", () => {
  const student = createStudentInputSchema.parse(validStudent);

  assert.equal(student.email, "sofia@example.com");
  assert.equal(student.phone, null);
  assert.equal(student.nationalityCode, "AR");
});

test("validates and normalizes the input used to update a student", () => {
  const student = updateStudentInputSchema.parse({
    ...validStudent,
    studentId: validStudent.id,
  });

  assert.equal(student.id, undefined);
  assert.equal(student.studentId, "student-01");
  assert.equal(student.email, "sofia@example.com");
  assert.equal(student.nationalityCode, "AR");
});

test("validates the quick rate and source update", () => {
  assert.deepEqual(
    updateStudentRateInputSchema.parse({
      studentId: "student-01",
      hourlyRateMinor: 2_500,
      source: "preply",
    }),
    {
      studentId: "student-01",
      hourlyRateMinor: 2_500,
      source: "preply",
      hasCustomPeriod: false,
      startDate: null,
      endDate: null,
    },
  );
  assert.equal(
    updateStudentRateInputSchema.safeParse({
      studentId: "student-01",
      hourlyRateMinor: 0,
      source: "private",
    }).success,
    false,
  );
  assert.equal(
    updateStudentRateInputSchema.safeParse({
      studentId: "student-01",
      hourlyRateMinor: 2_500,
      source: "other",
    }).success,
    false,
  );
  assert.equal(
    updateStudentRateInputSchema.safeParse({
      studentId: "student-01",
      hourlyRateMinor: 2_500,
      source: "private",
      hasCustomPeriod: true,
      startDate: null,
      endDate: null,
    }).success,
    false,
  );
  assert.equal(
    updateStudentRateInputSchema.safeParse({
      studentId: "student-01",
      hourlyRateMinor: 2_500,
      source: "private",
      hasCustomPeriod: true,
      startDate: "2026-05-10",
      endDate: "2026-05-09",
    }).success,
    false,
  );
});

test("validates rate deletion identifiers", () => {
  assert.deepEqual(
    deleteStudentRateInputSchema.parse({
      studentId: "student-01",
      rateId: "student-01-rate-initial",
    }),
    {
      studentId: "student-01",
      rateId: "student-01-rate-initial",
    },
  );
  assert.equal(
    deleteStudentRateInputSchema.safeParse({
      studentId: "student-01",
      rateId: "../another-rate",
    }).success,
    false,
  );
});

test("validates teacher commission settings", () => {
  assert.deepEqual(
    updateCommissionSettingsInputSchema.parse({
      preplyCommissionBps: 2_000,
      directCommissionBps: 650,
    }),
    {
      preplyCommissionBps: 2_000,
      directCommissionBps: 650,
    },
  );
  assert.equal(
    updateCommissionSettingsInputSchema.safeParse({
      preplyCommissionBps: 10_001,
      directCommissionBps: 650,
    }).success,
    false,
  );
});

test("uses a distinct visual style for every student card color", () => {
  assert.equal(
    new Set(Object.values(studentThemeStyles)).size,
    Object.keys(studentThemeStyles).length,
  );
  assert.equal(
    new Set(Object.values(studentThemeSwatches)).size,
    Object.keys(studentThemeSwatches).length,
  );
});

test("accepts Preply and rejects the removed Zoom contact channel", () => {
  assert.equal(
    createStudentInputSchema.safeParse({
      ...validStudent,
      preferredContactChannel: "preply",
    }).success,
    true,
  );
  assert.equal(
    createStudentInputSchema.safeParse({
      ...validStudent,
      preferredContactChannel: "zoom",
    }).success,
    false,
  );
});

test("rejects prefixed tag objects in favor of plain labels", () => {
  const result = createStudentInputSchema.safeParse({
    ...validStudent,
    preferences: [{ type: "builtin", key: "visualMaterials" }],
  });

  assert.equal(result.success, false);
});

test("rejects an invalid time zone", () => {
  const result = studentDtoSchema.safeParse({
    ...validStudent,
    timeZone: "Moon/Sea_of_Tranquility",
  });

  assert.equal(result.success, false);
});

test("rejects an unsupported country code", () => {
  const result = createStudentInputSchema.safeParse({
    ...validStudent,
    nationalityCode: "ZZ",
  });

  assert.equal(result.success, false);
});

test("derives Preply and Direct rates with integer rounding", () => {
  assert.deepEqual(calculateStudentRate(2_500, "preply", 1_800), {
    grossMinor: 2_500,
    platformFeeMinor: 450,
    netMinor: 2_050,
  });
  assert.deepEqual(calculateStudentRate(2_500, "private", 1_800), {
    grossMinor: 2_500,
    platformFeeMinor: 121,
    netMinor: 2_379,
  });
  assert.deepEqual(calculateStudentRate(1_000, "private", 1_800), {
    grossMinor: 1_000,
    platformFeeMinor: 49,
    netMinor: 951,
  });
  assert.deepEqual(calculateStudentRate(1_000, "private", 1_800, 650), {
    grossMinor: 1_000,
    platformFeeMinor: 65,
    netMinor: 935,
  });
});

test("accepts null or empty optional student details", () => {
  const empty = createStudentInputSchema.parse({
    ...validStudent,
    email: "",
    phone: "",
    birthDate: "",
    preferredContactChannel: "other",
  });
  const nullable = updateStudentInputSchema.parse({
    ...validStudent,
    studentId: validStudent.id,
    email: null,
    phone: null,
    birthDate: null,
    preferredContactChannel: "other",
  });

  assert.equal(empty.email, null);
  assert.equal(empty.phone, null);
  assert.equal(empty.birthDate, null);
  const omitted = createStudentInputSchema.parse({
    ...validStudent,
    email: undefined,
    phone: undefined,
    birthDate: undefined,
    preferredContactChannel: "other",
  });

  assert.equal(nullable.email, null);
  assert.equal(nullable.phone, null);
  assert.equal(nullable.birthDate, null);
  assert.equal(omitted.email, null);
  assert.equal(omitted.phone, null);
  assert.equal(omitted.birthDate, null);
});

test("validates optional emails and real, non-future birth dates", () => {
  assert.equal(
    createStudentInputSchema.safeParse({
      ...validStudent,
      email: "not-an-email",
    }).success,
    false,
  );
  assert.equal(
    createStudentInputSchema.safeParse({
      ...validStudent,
      birthDate: "2023-02-29",
    }).success,
    false,
  );
  assert.equal(
    createStudentInputSchema.safeParse({
      ...validStudent,
      birthDate: "2999-01-01",
    }).success,
    false,
  );
});

test("resolves today in the student's time zone", () => {
  const instant = new Date("2026-08-10T01:00:00.000Z");

  assert.equal(
    getDateOnlyToday("America/Argentina/Cordoba", instant),
    "2026-08-09",
  );
  assert.equal(getDateOnlyToday("Asia/Tokyo", instant), "2026-08-10");
});

test("requires contact details for email, phone, and WhatsApp", () => {
  for (const input of [
    { email: "", phone: "", preferredContactChannel: "email" },
    { email: "", phone: "", preferredContactChannel: "phone" },
    { email: "", phone: "", preferredContactChannel: "whatsapp" },
  ] as const) {
    const result = createStudentInputSchema.safeParse({
      ...validStudent,
      ...input,
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(
        result.error.issues.some(
          (issue) => issue.path[0] === "preferredContactChannel",
        ),
        true,
      );
    }
  }
});

test("keeps legacy students readable when preferred contact data is missing", () => {
  const student = studentDtoSchema.parse({
    ...validStudent,
    phone: null,
    preferredContactChannel: "whatsapp",
  });

  assert.equal(student.phone, null);
  assert.equal(student.preferredContactChannel, "whatsapp");
});

test("accepts deterministic local seed identifiers", () => {
  assert.deepEqual(studentIdInputSchema.parse({
    studentId: "local-seed-student-01",
  }), { studentId: "local-seed-student-01" });
});

test("rejects malformed student identifiers", () => {
  assert.equal(
    studentIdInputSchema.safeParse({ studentId: "../student-01" }).success,
    false,
  );
});

test("defaults and bounds student directory pages", () => {
  assert.deepEqual(studentListInputSchema.parse({}), {
    search: "",
    sort: "name",
    hideInactive: false,
    limit: 20,
    cursor: null,
  });
  assert.equal(studentListInputSchema.safeParse({ limit: 51 }).success, false);
});

test("rejects a cursor from a different directory sort", () => {
  assert.equal(
    studentListInputSchema.safeParse({
      sort: "name",
      cursor: {
        sort: "rate",
        isActive: true,
        hourlyRateMinor: 2_500,
        id: "student-01",
      },
    }).success,
    false,
  );
});

test("converts displayed rates to currency minor units", () => {
  assert.equal(toMinorUnits("20.55", 2), 2_055);
  assert.equal(toMinorUnits("invalid", 2), 0);
});
