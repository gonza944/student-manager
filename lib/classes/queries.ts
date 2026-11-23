import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  gt,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import type { createDb } from "../../db";
import { studentClass } from "../../db/class-schema";
import { student } from "../../db/student-schema";
import {
  classAvailabilitySchema,
  studentClassDtoSchema,
  studentClassPageSchema,
  studentClassTimelineSchema,
  type ClassAvailabilityInput,
  type ClassCursor,
  type StudentClassPageInput,
  type StudentClassTimelineInput,
} from "./contracts";
import { getClassDayRange } from "./scheduling";

type Database = ReturnType<typeof createDb>;

const classSelection = {
  ...getTableColumns(studentClass),
  studentName: student.name,
};

function toClassDto(row: typeof studentClass.$inferSelect & { studentName: string }) {
  return studentClassDtoSchema.parse({
    ...row,
    scheduledAt: row.scheduledAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toCursor(row: typeof studentClass.$inferSelect): ClassCursor {
  return { scheduledAt: row.scheduledAt.toISOString(), id: row.id };
}

function cursorCondition(input: StudentClassPageInput) {
  const scheduledAt = new Date(input.cursor.scheduledAt);
  return input.direction === "earlier"
    ? or(
        lt(studentClass.scheduledAt, scheduledAt),
        and(
          eq(studentClass.scheduledAt, scheduledAt),
          lt(studentClass.id, input.cursor.id),
        ),
      )
    : or(
        gt(studentClass.scheduledAt, scheduledAt),
        and(
          eq(studentClass.scheduledAt, scheduledAt),
          gt(studentClass.id, input.cursor.id),
        ),
      );
}

function ownedStudentLookup(db: Database, teacherId: string, studentId: string) {
  return db
    .select({ id: student.id })
    .from(student)
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .limit(1);
}

function classScope(teacherId: string, studentId?: string) {
  return and(
    eq(studentClass.teacherId, teacherId),
    eq(student.teacherId, teacherId),
    studentId === undefined ? undefined : eq(studentClass.studentId, studentId),
  );
}

export async function getTeacherStudentClassDetail(
  db: Database,
  teacherId: string,
  studentId: string,
  classId: string,
) {
  const [row] = await db
    .select(classSelection)
    .from(studentClass)
    .innerJoin(student, eq(student.id, studentClass.studentId))
    .where(
      and(
        eq(studentClass.id, classId),
        eq(studentClass.studentId, studentId),
        eq(studentClass.teacherId, teacherId),
      ),
    )
    .limit(1);

  return row ? toClassDto(row) : null;
}

export async function getTeacherClassAvailability(
  db: Database,
  teacherId: string,
  timeZone: string,
  input: ClassAvailabilityInput,
) {
  const { dayStart, dayEnd } = getClassDayRange(input.localDate, timeZone);
  const filters = [
    eq(studentClass.teacherId, teacherId),
    inArray(studentClass.status, ["scheduled", "completed"]),
    lt(studentClass.scheduledAt, dayEnd),
    sql`${studentClass.scheduledAt} + ${studentClass.durationMinutes} * 60000 > ${dayStart.getTime()}`,
  ];
  if (input.excludeClassId) {
    filters.push(ne(studentClass.id, input.excludeClassId));
  }

  const rows = await db
    .select(classSelection)
    .from(studentClass)
    .innerJoin(student, eq(student.id, studentClass.studentId))
    .where(and(...filters))
    .orderBy(asc(studentClass.scheduledAt), asc(studentClass.id));

  return classAvailabilitySchema.parse({
    localDate: input.localDate,
    dayStart: dayStart.toISOString(),
    dayEnd: dayEnd.toISOString(),
    intervals: rows.map(toClassDto),
  });
}

export async function getTeacherClassTimeline(
  db: Database,
  teacherId: string,
  input: StudentClassTimelineInput,
  now = new Date(),
) {
  const filters = classScope(teacherId, input.studentId);
  const [pastRows, futureRows, summaryRows, studentRows] = await db.batch([
    db
      .select(classSelection)
      .from(studentClass)
      .innerJoin(student, eq(student.id, studentClass.studentId))
      .where(and(filters, lt(studentClass.scheduledAt, now)))
      .orderBy(desc(studentClass.scheduledAt), desc(studentClass.id))
      .limit(input.limit + 1),
    db
      .select(classSelection)
      .from(studentClass)
      .innerJoin(student, eq(student.id, studentClass.studentId))
      .where(and(filters, gte(studentClass.scheduledAt, now)))
      .orderBy(asc(studentClass.scheduledAt), asc(studentClass.id))
      .limit(input.limit + 1),
    db
      .select({
        count: sql<number>`sum(case when ${studentClass.status} = 'completed' then 1 else 0 end)`,
        total: sql<number>`count(*)`,
        updatedAtTotal: sql<string>`cast(coalesce(sum(${studentClass.updatedAt}), 0) as text)`,
        studentUpdatedAtTotal: sql<string>`cast(coalesce(sum(${student.updatedAt}), 0) as text)`,
      })
      .from(studentClass)
      .innerJoin(student, eq(student.id, studentClass.studentId))
      .where(filters),
    ...(input.studentId === undefined
      ? []
      : [ownedStudentLookup(db, teacherId, input.studentId)]),
  ]);
  if (input.studentId !== undefined && !studentRows?.[0]) return null;

  const hasEarlier = pastRows.length > input.limit;
  const hasLater = futureRows.length > input.limit;
  const pastPage = pastRows.slice(0, input.limit);
  const futurePage = futureRows.slice(0, input.limit);
  const summary = summaryRows[0];
  const classRevision = `${summary?.total ?? 0}:${summary?.updatedAtTotal ?? "0"}:${summary?.count ?? 0}`;

  return studentClassTimelineSchema.parse({
    past: pastPage.toReversed().map(toClassDto),
    future: futurePage.map(toClassDto),
    earlierCursor:
      hasEarlier && pastPage.at(-1) ? toCursor(pastPage.at(-1)!) : null,
    laterCursor:
      hasLater && futurePage.at(-1) ? toCursor(futurePage.at(-1)!) : null,
    completedCount: Number(summary?.count ?? 0),
    revision:
      input.studentId === undefined
        ? `${classRevision}:${summary?.studentUpdatedAtTotal ?? "0"}`
        : classRevision,
  });
}

export async function listTeacherClassesPage(
  db: Database,
  teacherId: string,
  input: StudentClassPageInput,
) {
  if (input.studentId !== undefined) {
    const [ownedStudent] = await ownedStudentLookup(
      db,
      teacherId,
      input.studentId,
    );
    if (!ownedStudent) return null;
  }

  const rows = await db
    .select(classSelection)
    .from(studentClass)
    .innerJoin(student, eq(student.id, studentClass.studentId))
    .where(
      and(
        classScope(teacherId, input.studentId),
        cursorCondition(input),
      ),
    )
    .orderBy(
      input.direction === "earlier"
        ? desc(studentClass.scheduledAt)
        : asc(studentClass.scheduledAt),
      input.direction === "earlier" ? desc(studentClass.id) : asc(studentClass.id),
    )
    .limit(input.limit + 1);
  const hasNextPage = rows.length > input.limit;
  const pageRows = rows.slice(0, input.limit);
  const cursorRow = pageRows.at(-1);
  const chronological = input.direction === "earlier" ? pageRows.toReversed() : pageRows;

  return studentClassPageSchema.parse({
    classes: chronological.map(toClassDto),
    nextCursor: hasNextPage && cursorRow ? toCursor(cursorRow) : null,
  });
}
