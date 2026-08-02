// Shared student rules for both browser and server: Zod validates runtime data,
// and its inferred TypeScript types keep both sides on the same contract.
import { z } from "zod";

import { currencySchema } from "../currencies";
import { studentCountries } from "./geography";

export const studentSources = ["private", "preply"] as const;
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

const optionalTrimmedText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

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
  email: z.string().trim().toLowerCase().check(z.email()).max(320),
  phone: optionalTrimmedText(40),
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

export const createStudentInputSchema = studentDetailsSchema;

export const studentIdInputSchema = z.object({
  studentId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

export const setStudentActiveInputSchema = studentIdInputSchema.extend({
  isActive: z.boolean(),
});

export const teacherRateSettingsSchema = z.object({
  currency: currencySchema,
  preplyCommissionBps: z.int().min(0).max(10_000),
});

export const studentRateSchema = z.object({
  grossMinor: z.int().nonnegative(),
  platformFeeMinor: z.int().nonnegative(),
  netMinor: z.int().nonnegative(),
});

export const studentDtoSchema = studentDetailsSchema.extend({
  id: z.string().min(1).max(128),
  rates: studentRateSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const studentCardDtoSchema = studentDtoSchema.pick({
  id: true,
  name: true,
  source: true,
  level: true,
  isActive: true,
  avatarKey: true,
  themeColor: true,
  rates: true,
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

export const studentProfileSchema = z.object({
  currency: currencySchema,
  student: studentDtoSchema,
});

export const studentCountsSchema = z.object({
  totalStudents: z.int().nonnegative(),
  activeStudents: z.int().nonnegative(),
});

export type SetStudentActiveInput = z.input<typeof setStudentActiveInputSchema>;
export type CreateStudentInput = z.output<typeof createStudentInputSchema>;
export type StudentDto = z.output<typeof studentDtoSchema>;
export type StudentCardDto = z.output<typeof studentCardDtoSchema>;
export type StudentListInput = z.output<typeof studentListInputSchema>;
export type StudentCursor = z.output<typeof studentCursorSchema>;
export type StudentListPage = z.output<typeof studentListPageSchema>;
export type StudentProfile = z.output<typeof studentProfileSchema>;
export type StudentCounts = z.output<typeof studentCountsSchema>;

export function calculateStudentRate(
  grossMinor: number,
  source: (typeof studentSources)[number],
  preplyCommissionBps: number,
) {
  const platformFeeMinor =
    source === "preply"
      ? Math.floor((grossMinor * preplyCommissionBps + 5_000) / 10_000)
      : 0;

  return studentRateSchema.parse({
    grossMinor,
    platformFeeMinor,
    netMinor: grossMinor - platformFeeMinor,
  });
}
