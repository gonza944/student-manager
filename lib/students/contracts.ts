// Shared student rules for both browser and server: Zod validates runtime data,
// and its inferred TypeScript types keep both sides on the same contract.
import { z } from "zod";

import { currencySchema } from "../currencies";

export const studentSources = ["private", "preply"] as const;
export const contactChannels = [
  "email",
  "phone",
  "whatsapp",
  "telegram",
  "zoom",
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
export const tagKinds = ["preference", "interest"] as const;

export const studentTagSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("builtin"), key: z.string().trim().min(1).max(80) }),
  z.object({ type: z.literal("custom"), label: z.string().trim().min(1).max(80) }),
]);

export type StudentTag = z.infer<typeof studentTagSchema>;

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
  nationalityCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  timeZone: timeZoneSchema,
  preferredContactChannel: z.enum(contactChannels),
  contactDetails: optionalTrimmedText(240),
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

export const studentIdInputSchema = z.object({
  studentId: z.string().trim().min(1).max(128),
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

export const studentDirectorySchema = teacherRateSettingsSchema.extend({
  students: z.array(studentDtoSchema),
});

export type SetStudentActiveInput = z.input<typeof setStudentActiveInputSchema>;
export type StudentDto = z.output<typeof studentDtoSchema>;
export type StudentDirectory = z.output<typeof studentDirectorySchema>;

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
