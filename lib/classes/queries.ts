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

export async function getTeacherStudentClassTimeline(
  db: Database,
  teacherId: string,
  input: StudentClassTimelineInput,
  now = new Date(),
) {
  const filters = and(
    eq(studentClass.teacherId, teacherId),
    eq(studentClass.studentId, input.studentId),
  );
  const [studentRows, pastRows, futureRows, completedRows] = await db.batch([
    db
      .select({ id: student.id })
      .from(student)
      .where(
        and(eq(student.id, input.studentId), eq(student.teacherId, teacherId)),
      )
      .limit(1),
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
      .select({ count: sql<number>`count(*)` })
      .from(studentClass)
      .where(and(filters, eq(studentClass.status, "completed"))),
  ]);
  if (!studentRows[0]) return null;

  const hasEarlier = pastRows.length > input.limit;
  const hasLater = futureRows.length > input.limit;
  const pastPage = pastRows.slice(0, input.limit);
  const futurePage = futureRows.slice(0, input.limit);

  return studentClassTimelineSchema.parse({
    past: pastPage.toReversed().map(toClassDto),
    future: futurePage.map(toClassDto),
    earlierCursor:
      hasEarlier && pastPage.at(-1) ? toCursor(pastPage.at(-1)!) : null,
    laterCursor:
      hasLater && futurePage.at(-1) ? toCursor(futurePage.at(-1)!) : null,
    completedCount: Number(completedRows[0]?.count ?? 0),
  });
}

export async function listTeacherStudentClassesPage(
  db: Database,
  teacherId: string,
  input: StudentClassPageInput,
) {
  const [ownedStudent] = await db
    .select({ id: student.id })
    .from(student)
    .where(and(eq(student.id, input.studentId), eq(student.teacherId, teacherId)))
    .limit(1);
  if (!ownedStudent) return null;

  const rows = await db
    .select(classSelection)
    .from(studentClass)
    .innerJoin(student, eq(student.id, studentClass.studentId))
    .where(
      and(
        eq(studentClass.teacherId, teacherId),
        eq(studentClass.studentId, input.studentId),
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
