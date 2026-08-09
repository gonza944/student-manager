import "server-only";

// Database-only student operations. Authentication stays in the action layer;
// every query receives a teacher ID so student data remains tenant-scoped.
import {
  and,
  asc,
  desc,
  eq,
  gt,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type { createDb } from "../../db";
import { student } from "../../db/student-schema";
import {
  calculateStudentRate,
  type CreateStudentInput,
  type StudentCursor,
  studentCountsSchema,
  studentCardDtoSchema,
  studentDtoSchema,
  type StudentListInput,
  studentListPageSchema,
  studentProfileSchema,
  type StudentDto,
  type UpdateStudentInput,
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
    birthDate: row.birthDate,
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

function toStudentCardDto(
  row: typeof student.$inferSelect,
  preplyCommissionBps: number,
) {
  return studentCardDtoSchema.parse(
    toStudentDto(row, preplyCommissionBps),
  );
}

export function normalizeStudentName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function cursorCondition(cursor: StudentCursor): SQL {
  const withinStatus =
    cursor.sort === "name"
      ? or(
          gt(student.normalizedName, cursor.normalizedName),
          and(
            eq(student.normalizedName, cursor.normalizedName),
            gt(student.id, cursor.id),
          ),
        )
      : cursor.sort === "rate"
        ? or(
            lt(student.hourlyRateMinor, cursor.hourlyRateMinor),
            and(
              eq(student.hourlyRateMinor, cursor.hourlyRateMinor),
              gt(student.id, cursor.id),
            ),
          )
        : or(
            gt(student.level, cursor.level),
            and(eq(student.level, cursor.level), gt(student.id, cursor.id)),
          );

  if (!withinStatus) return sql`false`;

  return cursor.isActive
    ? or(
        and(eq(student.isActive, true), withinStatus),
        eq(student.isActive, false),
      )!
    : and(eq(student.isActive, false), withinStatus)!;
}

function toCursor(
  row: typeof student.$inferSelect,
  sort: StudentListInput["sort"],
): StudentCursor {
  return sort === "name"
    ? {
        sort,
        isActive: row.isActive,
        normalizedName: row.normalizedName,
        id: row.id,
      }
    : sort === "rate"
      ? {
          sort,
          isActive: row.isActive,
          hourlyRateMinor: row.hourlyRateMinor,
          id: row.id,
        }
      : {
          sort,
          isActive: row.isActive,
          level: row.level,
          id: row.id,
        };
}

export async function getTeacherStudentCounts(
  db: Database,
  teacherId: string,
) {
  const [counts] = await db
    .select({
      totalStudents: sql<number>`count(*)`,
      activeStudents: sql<number>`coalesce(sum(case when ${student.isActive} = 1 then 1 else 0 end), 0)`,
    })
    .from(student)
    .where(eq(student.teacherId, teacherId));

  return studentCountsSchema.parse({
    totalStudents: Number(counts?.totalStudents ?? 0),
    activeStudents: Number(counts?.activeStudents ?? 0),
  });
}

export async function listTeacherStudentsPage(
  db: Database,
  teacherId: string,
  settings: TeacherSettings,
  input: StudentListInput,
) {
  const filters: SQL[] = [eq(student.teacherId, teacherId)];
  if (input.hideInactive) filters.push(eq(student.isActive, true));
  if (input.search) {
    filters.push(
      sql`instr(${student.normalizedName}, ${normalizeStudentName(input.search)}) > 0`,
    );
  }
  if (input.cursor) filters.push(cursorCondition(input.cursor));

  const ordering =
    input.sort === "name"
      ? [desc(student.isActive), asc(student.normalizedName), asc(student.id)]
      : input.sort === "rate"
        ? [
            desc(student.isActive),
            desc(student.hourlyRateMinor),
            asc(student.id),
          ]
        : [desc(student.isActive), asc(student.level), asc(student.id)];
  const rowsPromise = db
    .select()
    .from(student)
    .where(and(...filters))
    .orderBy(...ordering)
    .limit(input.limit + 1);

  const [rows, counts] = await Promise.all([
    rowsPromise,
    getTeacherStudentCounts(db, teacherId),
  ]);
  const hasNextPage = rows.length > input.limit;
  const pageRows = hasNextPage ? rows.slice(0, input.limit) : rows;
  const lastRow = pageRows.at(-1);

  return studentListPageSchema.parse({
    ...settings,
    students: pageRows.map((row) =>
      toStudentCardDto(row, settings.preplyCommissionBps),
    ),
    nextCursor:
      hasNextPage && lastRow ? toCursor(lastRow, input.sort) : null,
    totalStudents: counts.totalStudents,
  });
}

export async function getTeacherStudentProfile(
  db: Database,
  teacherId: string,
  settings: TeacherSettings,
  studentId: string,
) {
  const [row] = await db
    .select()
    .from(student)
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .limit(1);

  if (!row) return null;

  return studentProfileSchema.parse({
    ...settings,
    student: toStudentDto(row, settings.preplyCommissionBps),
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
      normalizedName: normalizeStudentName(input.name),
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

export async function updateTeacherStudent(
  db: Database,
  teacherId: string,
  input: UpdateStudentInput,
  preplyCommissionBps: number,
) {
  const { studentId, ...details } = input;
  const [updated] = await db
    .update(student)
    .set({
      ...details,
      normalizedName: normalizeStudentName(details.name),
      updatedAt: new Date(),
    })
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .returning();

  return updated ? toStudentDto(updated, preplyCommissionBps) : null;
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
