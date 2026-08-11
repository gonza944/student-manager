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
import { user } from "../../db/schema";
import { student, studentRateHistory } from "../../db/student-schema";
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
  type UpdateStudentRateInput,
} from "./contracts";
import {
  buildStudentRateTimeline,
  createRateSnapshot,
  hasRateChanged,
} from "./rate-history";

type Database = ReturnType<typeof createDb>;
type TeacherSettings = {
  currency: string;
  preplyCommissionBps: number;
  directCommissionBps: number;
};

function toStudentDto(
  row: typeof student.$inferSelect,
  preplyCommissionBps: number,
  directCommissionBps: number,
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
      directCommissionBps,
    ),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toStudentCardDto(
  row: typeof student.$inferSelect,
  preplyCommissionBps: number,
  directCommissionBps: number,
) {
  return studentCardDtoSchema.parse(
    toStudentDto(row, preplyCommissionBps, directCommissionBps),
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
      toStudentCardDto(
        row,
        settings.preplyCommissionBps,
        settings.directCommissionBps,
      ),
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
  const [studentRows, historyRows] = await Promise.all([
    db
      .select()
      .from(student)
      .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
      .limit(1),
    db
      .select()
      .from(studentRateHistory)
      .where(
        and(
          eq(studentRateHistory.studentId, studentId),
          eq(studentRateHistory.teacherId, teacherId),
        ),
      )
      .orderBy(asc(studentRateHistory.effectiveAt), asc(studentRateHistory.id)),
  ]);
  const row = studentRows[0];

  if (!row) return null;

  return studentProfileSchema.parse({
    ...settings,
    student: toStudentDto(
      row,
      settings.preplyCommissionBps,
      settings.directCommissionBps,
    ),
    rateTimeline: buildStudentRateTimeline(historyRows),
  });
}

export async function createTeacherStudent(
  db: Database,
  teacherId: string,
  input: CreateStudentInput,
  preplyCommissionBps: number,
  directCommissionBps: number,
) {
  const studentId = crypto.randomUUID();
  const now = new Date();
  const snapshot = createRateSnapshot(
    input.hourlyRateMinor,
    input.source,
    preplyCommissionBps,
    directCommissionBps,
  );
  const [createdRows] = await db.batch([
    db.insert(student).values({
      id: studentId,
      teacherId,
      ...input,
      normalizedName: normalizeStudentName(input.name),
      createdAt: now,
      updatedAt: now,
    }).returning(),
    db.insert(studentRateHistory).values({
      id: crypto.randomUUID(),
      studentId,
      teacherId,
      ...snapshot,
      effectiveAt: now,
    }),
  ]);
  const created = createdRows[0];

  if (!created) {
    throw new Error("Student creation did not return the created record.");
  }

  return toStudentDto(
    created,
    preplyCommissionBps,
    directCommissionBps,
  );
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

export async function updateTeacherStudentRate(
  db: Database,
  teacherId: string,
  input: UpdateStudentRateInput,
  preplyCommissionBps: number,
  directCommissionBps: number,
) {
  const [studentRows, historyRows] = await db.batch([
    db
      .select()
      .from(student)
      .where(
        and(eq(student.id, input.studentId), eq(student.teacherId, teacherId)),
      )
      .limit(1),
    db
      .select()
      .from(studentRateHistory)
      .where(
        and(
          eq(studentRateHistory.studentId, input.studentId),
          eq(studentRateHistory.teacherId, teacherId),
        ),
      )
      .orderBy(desc(studentRateHistory.effectiveAt), desc(studentRateHistory.id))
      .limit(1),
  ]);
  if (!studentRows[0]) return null;

  const now = new Date();
  const snapshot = createRateSnapshot(
    input.hourlyRateMinor,
    input.source,
    preplyCommissionBps,
    directCommissionBps,
  );
  const updateStudentQuery = db
    .update(student)
    .set({
      hourlyRateMinor: input.hourlyRateMinor,
      source: input.source,
      updatedAt: now,
    })
    .where(
      and(
        eq(student.id, input.studentId),
        eq(student.teacherId, teacherId),
      ),
    )
    .returning();
  const latestHistory = historyRows[0];

  if (hasRateChanged(latestHistory, snapshot)) {
    const [updatedRows] = await db.batch([
      updateStudentQuery,
      db.insert(studentRateHistory).values({
        id: crypto.randomUUID(),
        studentId: input.studentId,
        teacherId,
        ...snapshot,
        effectiveAt: now,
      }),
    ]);
    const updated = updatedRows[0];

    return updated
      ? toStudentDto(updated, preplyCommissionBps, directCommissionBps)
      : null;
  }

  const [updatedRows] = await db.batch([updateStudentQuery]);
  const updated = updatedRows[0];

  return updated
    ? toStudentDto(updated, preplyCommissionBps, directCommissionBps)
    : null;
}

export async function updateTeacherStudent(
  db: Database,
  teacherId: string,
  input: UpdateStudentInput,
  preplyCommissionBps: number,
  directCommissionBps: number,
) {
  const { studentId, ...details } = input;
  const [studentRows, historyRows] = await db.batch([
    db
      .select()
      .from(student)
      .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
      .limit(1),
    db
      .select()
      .from(studentRateHistory)
      .where(
        and(
          eq(studentRateHistory.studentId, studentId),
          eq(studentRateHistory.teacherId, teacherId),
        ),
      )
      .orderBy(desc(studentRateHistory.effectiveAt), desc(studentRateHistory.id))
      .limit(1),
  ]);
  if (!studentRows[0]) return null;

  const now = new Date();
  const snapshot = createRateSnapshot(
    details.hourlyRateMinor,
    details.source,
    preplyCommissionBps,
    directCommissionBps,
  );
  const updateQuery = db.update(student).set({
      ...details,
      normalizedName: normalizeStudentName(details.name),
      updatedAt: now,
    })
    .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
    .returning();
  const latestHistory = historyRows[0];

  if (hasRateChanged(latestHistory, snapshot)) {
    const [updatedRows] = await db.batch([
      updateQuery,
      db.insert(studentRateHistory).values({
        id: crypto.randomUUID(),
        studentId,
        teacherId,
        ...snapshot,
        effectiveAt: now,
      }),
    ]);
    const updated = updatedRows[0];
    return updated
      ? toStudentDto(updated, preplyCommissionBps, directCommissionBps)
      : null;
  }

  const [updatedRows] = await db.batch([updateQuery]);
  const updated = updatedRows[0];

  return updated
    ? toStudentDto(updated, preplyCommissionBps, directCommissionBps)
    : null;
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

export async function updateTeacherCommissions(
  db: Database,
  teacherId: string,
  preplyCommissionBps: number,
  directCommissionBps: number,
) {
  const [studentRows, historyRows] = await db.batch([
    db.select().from(student).where(eq(student.teacherId, teacherId)),
    db
      .select()
      .from(studentRateHistory)
      .where(eq(studentRateHistory.teacherId, teacherId))
      .orderBy(
        desc(studentRateHistory.effectiveAt),
        desc(studentRateHistory.id),
      ),
  ]);
  const latestHistoryByStudent = new Map<
    string,
    typeof studentRateHistory.$inferSelect
  >();
  for (const history of historyRows) {
    if (!latestHistoryByStudent.has(history.studentId)) {
      latestHistoryByStudent.set(history.studentId, history);
    }
  }

  const now = new Date();
  const historyInserts = studentRows.flatMap((row) => {
    const snapshot = createRateSnapshot(
      row.hourlyRateMinor,
      row.source,
      preplyCommissionBps,
      directCommissionBps,
    );

    return hasRateChanged(latestHistoryByStudent.get(row.id), snapshot)
      ? [
          db.insert(studentRateHistory).values({
            id: crypto.randomUUID(),
            studentId: row.id,
            teacherId,
            ...snapshot,
            effectiveAt: now,
          }),
        ]
      : [];
  });

  await db.batch([
    db
      .update(user)
      .set({ preplyCommissionBps, directCommissionBps })
      .where(eq(user.id, teacherId)),
    ...historyInserts,
  ]);

  return { preplyCommissionBps, directCommissionBps };
}
