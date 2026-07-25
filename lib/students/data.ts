import "server-only";

// Database-only student operations. Authentication stays in the action layer;
// every query receives a teacher ID so student data remains tenant-scoped.
import { and, asc, desc, eq } from "drizzle-orm";

import type { createDb } from "../../db";
import { student } from "../../db/student-schema";
import {
  calculateStudentRate,
  type CreateStudentInput,
  studentDirectorySchema,
  studentDtoSchema,
  type StudentDto,
} from "./contracts";

type Database = ReturnType<typeof createDb>;
type TeacherSettings = {
  currency: string;
  preplyCommissionBps: number;
};

function toStudentDto(
  row: typeof student.$inferSelect,
  preplyCommissionBps: number,
): StudentDto {
  return studentDtoSchema.parse({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    nationalityCode: row.nationalityCode,
    timeZone: row.timeZone,
    preferredContactChannel: row.preferredContactChannel,
    level: row.level,
    preferences: row.preferences,
    interests: row.interests,
    learningGoals: row.learningGoals,
    source: row.source,
    hourlyRateMinor: row.hourlyRateMinor,
    isActive: row.isActive,
    avatarKey: row.avatarKey,
    themeColor: row.themeColor,
    rates: calculateStudentRate(
      row.hourlyRateMinor,
      row.source,
      preplyCommissionBps,
    ),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function listTeacherStudents(
  db: Database,
  teacherId: string,
  settings: TeacherSettings,
) {
  const rows = await db
    .select()
    .from(student)
    .where(eq(student.teacherId, teacherId))
    .orderBy(desc(student.isActive), asc(student.normalizedName), asc(student.id));

  return studentDirectorySchema.parse({
    ...settings,
    students: rows.map((row) =>
      toStudentDto(row, settings.preplyCommissionBps),
    ),
  });
}

export async function createTeacherStudent(
  db: Database,
  teacherId: string,
  input: CreateStudentInput,
  preplyCommissionBps: number,
) {
  const [created] = await db
    .insert(student)
    .values({
      id: crypto.randomUUID(),
      teacherId,
      ...input,
      normalizedName: input.name
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase(),
    })
    .returning();

  return toStudentDto(created, preplyCommissionBps);
}

export async function setTeacherStudentActive(
  db: Database,
  teacherId: string,
  studentId: string,
  isActive: boolean,
) {
  const [updated] = await db
    .update(student)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .returning({ id: student.id, isActive: student.isActive });

  return updated ?? null;
}

export async function deleteTeacherStudent(
  db: Database,
  teacherId: string,
  studentId: string,
) {
  const [deleted] = await db
    .delete(student)
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .returning({ id: student.id });

  return deleted ?? null;
}
