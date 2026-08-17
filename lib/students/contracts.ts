// Shared student rules for both browser and server: Zod validates runtime data,
// and its inferred TypeScript types keep both sides on the same contract.
import { z } from "zod";

import { currencySchema } from "../currencies";
import { studentCountries } from "./geography";

export const studentSources = ["private", "preply"] as const;
export const defaultDirectCommissionBps = 485;
export const contactChannels = [
  "email",
  "phone",
  "whatsapp",
  "telegram",
  "preply",
  "other",
] as const;
export const studentLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const studentThemeColors = [
  "coral",
  "gold",
  "mint",
  "sky",
  "violet",
  "rose",
] as const;
export const studentListSorts = ["name", "rate", "level"] as const;
export const studentAvatarKeys = [
  "avatar-01",
  "avatar-02",
  "avatar-03",
  "avatar-04",
  "avatar-05",
  "avatar-06",
  "avatar-07",
  "avatar-08",
  "avatar-09",
  "avatar-10",
  "avatar-11",
  "avatar-12",
  "avatar-13",
  "avatar-14",
  "avatar-15",
  "avatar-16",
  "avatar-17",
  "avatar-18",
  "avatar-19",
  "avatar-20",
  "avatar-21",
  "avatar-22",
  "avatar-23",
  "avatar-24",
  "avatar-25",
  "avatar-26",
  "avatar-27",
  "avatar-28",
  "avatar-29",
  "avatar-30",
  "avatar-31",
  "avatar-32",
] as const;
const studentTagSchema = z.string().trim().min(1).max(80);
const studentCountryCodes = new Set<string>(
  studentCountries.map((country) => country.code),
);

function normalizeOptionalText(value: unknown) {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  return value.trim() || null;
}

function normalizeOptionalEmail(value: unknown) {
  const normalized = normalizeOptionalText(value);
  return typeof normalized === "string" ? normalized.toLowerCase() : normalized;
}

const optionalTrimmedText = (maximum: number) =>
  z.preprocess(normalizeOptionalText, z.string().max(maximum).nullable());

const optionalEmail = z.preprocess(
  normalizeOptionalEmail,
  z.email().max(320).nullable(),
);

const optionalBirthDate = z.preprocess(
  normalizeOptionalText,
  z.iso.date().nullable(),
);

const timeZoneSchema = z.string().trim().min(1).max(80).refine((timeZone) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
});

const studentDetailsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: optionalEmail,
  phone: optionalTrimmedText(40),
  birthDate: optionalBirthDate,
  nationalityCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((countryCode) => studentCountryCodes.has(countryCode)),
  timeZone: timeZoneSchema,
  preferredContactChannel: z.enum(contactChannels),
  level: z.enum(studentLevels),
  preferences: z.array(studentTagSchema).max(20).default([]),
  interests: z.array(studentTagSchema).max(20).default([]),
  learningGoals: optionalTrimmedText(2_000),
  source: z.enum(studentSources),
  hourlyRateMinor: z.int().positive().max(100_000_000),
  isActive: z.boolean().default(true),
  avatarKey: z.enum(studentAvatarKeys),
  themeColor: z.enum(studentThemeColors),
});

function validatePreferredContact(
  {
    email,
    phone,
    preferredContactChannel,
  }: {
    email: string | null;
    phone: string | null;
    preferredContactChannel: (typeof contactChannels)[number];
  },
  context: z.RefinementCtx,
) {
  if (preferredContactChannel === "email" && !email) {
    context.addIssue({
      code: "custom",
      path: ["preferredContactChannel"],
      message: "Email contact requires an email address.",
    });
  }
  if (
    (preferredContactChannel === "phone" ||
      preferredContactChannel === "whatsapp") &&
    !phone
  ) {
    context.addIssue({
      code: "custom",
      path: ["preferredContactChannel"],
      message: "Phone contact requires a phone number.",
    });
  }
}

export function getDateOnlyToday(timeZone: string, now = new Date()) {
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(now)
        .map(({ type, value }) => [type, value]),
    );

    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return undefined;
  }
}

function validateBirthDate(
  {
    birthDate,
    timeZone,
  }: {
    birthDate: string | null;
    timeZone: string;
  },
  context: z.RefinementCtx,
) {
  const today = getDateOnlyToday(timeZone);
  if (birthDate && today && birthDate > today) {
    context.addIssue({
      code: "custom",
      path: ["birthDate"],
      message: "Birth date cannot be in the future.",
    });
  }
}

function validateStudentInput(
  details: z.output<typeof studentDetailsSchema>,
  context: z.RefinementCtx,
) {
  validatePreferredContact(details, context);
  validateBirthDate(details, context);
}

export const createStudentInputSchema =
  studentDetailsSchema.superRefine(validateStudentInput);

export const studentIdInputSchema = z.object({
  studentId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export const updateStudentInputSchema = studentDetailsSchema
  .extend({
    studentId: studentIdInputSchema.shape.studentId,
  })
  .superRefine(validateStudentInput);

export const updateStudentRateInputSchema = studentIdInputSchema.extend({
  hourlyRateMinor: z.int().positive().max(100_000_000),
  source: z.enum(studentSources),
  hasCustomPeriod: z.boolean().default(false),
  startDate: z.iso.date().nullable().default(null),
  endDate: z.iso.date().nullable().default(null),
}).superRefine(({ hasCustomPeriod, startDate, endDate }, context) => {
  if (hasCustomPeriod && !startDate) {
    context.addIssue({
      code: "custom",
      path: ["startDate"],
      message: "A custom rate period requires a start date.",
    });
  }
  if (hasCustomPeriod && startDate && endDate && endDate < startDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "The end date cannot be before the start date.",
    });
  }
});

export const deleteStudentRateInputSchema = studentIdInputSchema.extend({
  rateId: z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/),
});

export const setStudentActiveInputSchema = studentIdInputSchema.extend({
  isActive: z.boolean(),
});

export const teacherRateSettingsSchema = z.object({
  currency: currencySchema,
  preplyCommissionBps: z.int().min(0).max(10_000),
  directCommissionBps: z.int().min(0).max(10_000),
});

export const updateCommissionSettingsInputSchema = z.object({
  preplyCommissionBps: z.int().min(0).max(10_000),
  directCommissionBps: z.int().min(0).max(10_000),
});

export const studentRateSchema = z.object({
  grossMinor: z.int().nonnegative(),
  platformFeeMinor: z.int().nonnegative(),
  netMinor: z.int().nonnegative(),
});

export const studentRateHistoryEntrySchema = z.object({
  id: z.string().min(1).max(256),
  grossMinor: z.int().positive(),
  feeBps: z.int().min(0).max(10_000),
  feeMinor: z.int().nonnegative(),
  netMinor: z.int().nonnegative(),
  source: z.enum(studentSources),
  effectiveAt: z.iso.datetime(),
  effectiveUntil: z.iso.datetime().nullable(),
  durationMs: z.int().nonnegative(),
  differenceFromPreviousMinor: z.int().nullable(),
});

export const studentRateTimelineSchema = z.object({
  current: studentRateHistoryEntrySchema,
  previous: z.array(studentRateHistoryEntrySchema),
});

export const studentRateHistoryCursorSchema = z.object({
  effectiveAt: z.iso.datetime(),
  sequence: z.int().positive(),
});

export const studentRateHistoryListInputSchema = studentIdInputSchema.extend({
  limit: z.int().min(1).max(50).default(20),
  cursor: studentRateHistoryCursorSchema.nullable().default(null),
});

export const studentRateHistoryPageSchema = z.object({
  entries: z.array(studentRateHistoryEntrySchema),
  nextCursor: studentRateHistoryCursorSchema.nullable(),
});

export const studentDtoSchema = studentDetailsSchema
  .extend({
    id: z.string().min(1).max(128),
    rates: studentRateSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .superRefine(validateBirthDate);

export const studentCardDtoSchema = studentDetailsSchema
  .pick({
    name: true,
    source: true,
    level: true,
    isActive: true,
    avatarKey: true,
    themeColor: true,
  })
  .extend({
    id: z.string().min(1).max(128),
    rates: studentRateSchema,
  });

const namedStudentCursorSchema = z.object({
  sort: z.literal("name"),
  isActive: z.boolean(),
  normalizedName: z.string(),
  id: z.string().min(1).max(128),
});

const ratedStudentCursorSchema = z.object({
  sort: z.literal("rate"),
  isActive: z.boolean(),
  hourlyRateMinor: z.int().positive(),
  id: z.string().min(1).max(128),
});

const leveledStudentCursorSchema = z.object({
  sort: z.literal("level"),
  isActive: z.boolean(),
  level: z.enum(studentLevels),
  id: z.string().min(1).max(128),
});

export const studentCursorSchema = z.discriminatedUnion("sort", [
  namedStudentCursorSchema,
  ratedStudentCursorSchema,
  leveledStudentCursorSchema,
]);

export const studentListInputSchema = z
  .object({
    search: z.string().trim().max(120).default(""),
    sort: z.enum(studentListSorts).default("name"),
    hideInactive: z.boolean().default(false),
    limit: z.int().min(1).max(50).default(20),
    cursor: studentCursorSchema.nullable().default(null),
  })
  .refine(
    ({ cursor, sort }) => cursor === null || cursor.sort === sort,
    { path: ["cursor"], message: "Cursor does not match the requested sort." },
  );

export const studentListPageSchema = teacherRateSettingsSchema.extend({
  students: z.array(studentCardDtoSchema),
  nextCursor: studentCursorSchema.nullable(),
  totalStudents: z.int().nonnegative(),
});

export const studentProfileSchema = teacherRateSettingsSchema.extend({
  student: studentDtoSchema,
  rateHistory: studentRateHistoryPageSchema,
});

export const studentCountsSchema = z.object({
  totalStudents: z.int().nonnegative(),
  activeStudents: z.int().nonnegative(),
});

export type SetStudentActiveInput = z.input<typeof setStudentActiveInputSchema>;
export type CreateStudentInput = z.output<typeof createStudentInputSchema>;
export type UpdateStudentInput = z.output<typeof updateStudentInputSchema>;
export type UpdateStudentRateInput = z.output<
  typeof updateStudentRateInputSchema
>;
export type DeleteStudentRateInput = z.output<
  typeof deleteStudentRateInputSchema
>;
export type StudentDto = z.output<typeof studentDtoSchema>;
export type StudentCardDto = z.output<typeof studentCardDtoSchema>;
export type StudentRateHistoryEntry = z.output<
  typeof studentRateHistoryEntrySchema
>;
export type StudentRateTimeline = z.output<typeof studentRateTimelineSchema>;
export type StudentRateHistoryCursor = z.output<
  typeof studentRateHistoryCursorSchema
>;
export type StudentRateHistoryListInput = z.output<
  typeof studentRateHistoryListInputSchema
>;
export type StudentRateHistoryPage = z.output<
  typeof studentRateHistoryPageSchema
>;
export type StudentListInput = z.output<typeof studentListInputSchema>;
export type StudentCursor = z.output<typeof studentCursorSchema>;
export type StudentListPage = z.output<typeof studentListPageSchema>;
export type StudentProfile = z.output<typeof studentProfileSchema>;
export type StudentCounts = z.output<typeof studentCountsSchema>;

export function getStudentCommissionBps(
  source: (typeof studentSources)[number],
  preplyCommissionBps: number,
  directCommissionBps = defaultDirectCommissionBps,
) {
  return source === "preply" ? preplyCommissionBps : directCommissionBps;
}

export function calculateStudentRate(
  grossMinor: number,
  source: (typeof studentSources)[number],
  preplyCommissionBps: number,
  directCommissionBps = defaultDirectCommissionBps,
) {
  const commissionBps = getStudentCommissionBps(
    source,
    preplyCommissionBps,
    directCommissionBps,
  );
  const platformFeeMinor = Math.floor(
    (grossMinor * commissionBps + 5_000) / 10_000,
  );

  return studentRateSchema.parse({
    grossMinor,
    platformFeeMinor,
    netMinor: grossMinor - platformFeeMinor,
  });
}
