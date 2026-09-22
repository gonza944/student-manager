import { z } from "zod";

import { currencySchema } from "../currencies";

export const classStatuses = ["scheduled", "completed", "cancelled"] as const;
export const classPageDirections = ["earlier", "later"] as const;

const entityIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
const durationMinutesSchema = z
  .int()
  .positive()
  .refine((duration) => duration % 5 === 0);

export const classIdInputSchema = z.object({
  classId: entityIdSchema,
});

export const studentClassIdInputSchema = classIdInputSchema.extend({
  studentId: entityIdSchema,
});

export const createStudentClassInputSchema = z.object({
  studentId: entityIdSchema,
  scheduledAt: z.iso.datetime(),
  durationMinutes: durationMinutesSchema,
});

export const updateStudentClassInputSchema = studentClassIdInputSchema.extend({
  scheduledAt: z.iso.datetime(),
  durationMinutes: durationMinutesSchema,
  chargeMinor: z.int().nonnegative().max(100_000_000),
});

export const setStudentClassStatusInputSchema = studentClassIdInputSchema.extend({
  status: z.enum(["completed", "cancelled"]),
});

export const classAvailabilityInputSchema = z.object({
  localDate: z.iso.date(),
  excludeClassId: entityIdSchema.nullable().default(null),
});

export const classCursorSchema = z.object({
  scheduledAt: z.iso.datetime(),
  id: entityIdSchema,
});

export const studentClassPageInputSchema = z.object({
  studentId: entityIdSchema,
  direction: z.enum(classPageDirections),
  limit: z.int().min(1).max(50).default(20),
  cursor: classCursorSchema,
});

export const studentClassTimelineInputSchema = z.object({
  studentId: entityIdSchema,
  limit: z.int().min(1).max(50).default(20),
});

export const studentClassDtoSchema = z.object({
  id: entityIdSchema,
  studentId: entityIdSchema,
  studentName: z.string().min(1).max(120),
  scheduledAt: z.iso.datetime(),
  durationMinutes: durationMinutesSchema,
  hourlyRateSnapshotMinor: z.int().positive(),
  currency: currencySchema,
  chargeMinor: z.int().nonnegative(),
  status: z.enum(classStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const classBusyIntervalSchema = studentClassDtoSchema.pick({
  id: true,
  studentId: true,
  studentName: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
});

export const classAvailabilitySchema = z.object({
  localDate: z.iso.date(),
  dayStart: z.iso.datetime(),
  dayEnd: z.iso.datetime(),
  intervals: z.array(classBusyIntervalSchema),
});

export const studentClassPageSchema = z.object({
  classes: z.array(studentClassDtoSchema),
  nextCursor: classCursorSchema.nullable(),
});

export const studentClassTimelineSchema = z.object({
  past: z.array(studentClassDtoSchema),
  future: z.array(studentClassDtoSchema),
  earlierCursor: classCursorSchema.nullable(),
  laterCursor: classCursorSchema.nullable(),
  completedCount: z.int().nonnegative(),
});

export type ClassStatus = (typeof classStatuses)[number];
export type CreateStudentClassInput = z.output<
  typeof createStudentClassInputSchema
>;
export type UpdateStudentClassInput = z.output<
  typeof updateStudentClassInputSchema
>;
export type SetStudentClassStatusInput = z.output<
  typeof setStudentClassStatusInputSchema
>;
export type ClassAvailabilityInput = z.output<
  typeof classAvailabilityInputSchema
>;
export type ClassCursor = z.output<typeof classCursorSchema>;
export type StudentClassPageInput = z.output<
  typeof studentClassPageInputSchema
>;
export type StudentClassTimelineInput = z.output<
  typeof studentClassTimelineInputSchema
>;
export type StudentClassDto = z.output<typeof studentClassDtoSchema>;
export type ClassAvailability = z.output<typeof classAvailabilitySchema>;
export type StudentClassPage = z.output<typeof studentClassPageSchema>;
export type StudentClassTimeline = z.output<typeof studentClassTimelineSchema>;
