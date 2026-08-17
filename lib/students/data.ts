import "server-only";

// Database-only student operations. Authentication stays in the action layer;
// every query receives a teacher ID so student data remains tenant-scoped.
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  isNull,
  lt,
  ne,
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
  type DeleteStudentRateInput,
  type StudentCursor,
  type StudentRateHistoryListInput,
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
  buildStudentRateHistoryPage,
  createRateSnapshot,
  hasRateChanged,
  resolveRatePeriod,
} from "./rate-history";

type Database = ReturnType<typeof createDb>;
type TeacherSettings = {
  currency: string;
  preplyCommissionBps: number;
  directCommissionBps: number;
};
type StudentRateUpdateResult =
  | { status: "ok"; data: StudentDto }
  | { status: "notFound" }
  | { status: "invalidDate" }
  | { status: "overlap" };
type StudentRateDeleteResult =
  | { status: "ok"; data: { id: string } }
  | { status: "notFound" }
  | { status: "protected" };

const historySequence = sql<number>`${studentRateHistory}.rowid`;

function rateHistoryCursorCondition(
  cursor: StudentRateHistoryListInput["cursor"],
) {
  if (!cursor) return undefined;

  const effectiveAt = new Date(cursor.effectiveAt);
  return or(
    lt(studentRateHistory.effectiveAt, effectiveAt),
    and(
      eq(studentRateHistory.effectiveAt, effectiveAt),
      lt(historySequence, cursor.sequence),
    ),
  );
}

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
  const [studentRows, rateHistory] = await Promise.all([
    db
      .select()
      .from(student)
      .where(and(eq(student.id, studentId), eq(student.teacherId, teacherId)))
      .limit(1),
    listTeacherStudentRatesPage(db, teacherId, {
      studentId,
      limit: 20,
      cursor: null,
    }),
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
    rateHistory,
  });
}

export async function listTeacherStudentRatesPage(
  db: Database,
  teacherId: string,
  input: StudentRateHistoryListInput,
) {
  const cursorCondition = rateHistoryCursorCondition(input.cursor);
  const rows = await db
    .select({
      ...getTableColumns(studentRateHistory),
      sequence: historySequence,
    })
    .from(studentRateHistory)
    .where(
      and(
        eq(studentRateHistory.studentId, input.studentId),
        eq(studentRateHistory.teacherId, teacherId),
        cursorCondition,
      ),
    )
    .orderBy(desc(studentRateHistory.effectiveAt), desc(historySequence))
    .limit(input.limit + 1);

  return buildStudentRateHistoryPage(
    rows,
    input.limit,
    input.cursor ? new Date(input.cursor.effectiveAt) : null,
  );
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
): Promise<StudentRateUpdateResult> {
  const [studentRows, historyRows] = await db.batch([
    db
      .select()
      .from(student)
      .where(
        and(eq(student.id, input.studentId), eq(student.teacherId, teacherId)),
      )
      .limit(1),
    db
      .select({
        ...getTableColumns(studentRateHistory),
        sequence: historySequence,
      })
      .from(studentRateHistory)
      .where(
        and(
          eq(studentRateHistory.studentId, input.studentId),
          eq(studentRateHistory.teacherId, teacherId),
        ),
      )
      .orderBy(asc(studentRateHistory.effectiveAt), asc(historySequence)),
  ]);
  const studentRow = studentRows[0];
  if (!studentRow) return { status: "notFound" } as const;

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
  const latestHistory = historyRows.at(-1);

  if (input.hasCustomPeriod) {
    const period = resolveRatePeriod(
      historyRows,
      input.startDate!,
      input.endDate,
      studentRow.timeZone,
      now,
    );
    if (!period.ok) return { status: period.error } as const;

    if (!hasRateChanged(period.activeRate, snapshot)) {
      if (period.restoreAt) {
        return {
          status: "ok",
          data: toStudentDto(
            studentRow,
            preplyCommissionBps,
            directCommissionBps,
          ),
        } as const;
      }

      const [updatedRows] = await db.batch([updateStudentQuery]);
      const updated = updatedRows[0];
      return updated
        ? {
            status: "ok",
            data: toStudentDto(
              updated,
              preplyCommissionBps,
              directCommissionBps,
            ),
          } as const
        : ({ status: "notFound" } as const);
    }

    const insertRateQuery = db.insert(studentRateHistory).values({
      id: crypto.randomUUID(),
      studentId: input.studentId,
      teacherId,
      ...snapshot,
      effectiveAt: period.effectiveAt,
    });

    if (period.restoreAt) {
      if (period.hasRestoreBoundary) {
        await insertRateQuery;
      } else {
        await db.batch([
          insertRateQuery,
          db.insert(studentRateHistory).values({
            id: crypto.randomUUID(),
            studentId: input.studentId,
            teacherId,
            grossRateMinor: period.activeRate.grossRateMinor,
            feeBps: period.activeRate.feeBps,
            feeAmountMinor: period.activeRate.feeAmountMinor,
            netRateMinor: period.activeRate.netRateMinor,
            source: period.activeRate.source,
            effectiveAt: period.restoreAt,
          }),
        ]);
      }

      return {
        status: "ok",
        data: toStudentDto(
          studentRow,
          preplyCommissionBps,
          directCommissionBps,
        ),
      } as const;
    }

    const [updatedRows] = await db.batch([
      updateStudentQuery,
      insertRateQuery,
    ]);
    const updated = updatedRows[0];
    return updated
      ? {
          status: "ok",
          data: toStudentDto(
            updated,
            preplyCommissionBps,
            directCommissionBps,
          ),
        } as const
      : ({ status: "notFound" } as const);
  }

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
      ? {
          status: "ok",
          data: toStudentDto(
            updated,
            preplyCommissionBps,
            directCommissionBps,
          ),
        } as const
      : ({ status: "notFound" } as const);
  }

  const [updatedRows] = await db.batch([updateStudentQuery]);
  const updated = updatedRows[0];

  return updated
    ? {
        status: "ok",
        data: toStudentDto(
          updated,
          preplyCommissionBps,
          directCommissionBps,
        ),
      } as const
    : ({ status: "notFound" } as const);
}

export async function deleteTeacherStudentRate(
  db: Database,
  teacherId: string,
  input: DeleteStudentRateInput,
): Promise<StudentRateDeleteResult> {
  const history = await db
    .select({
      ...getTableColumns(studentRateHistory),
      sequence: historySequence,
    })
    .from(studentRateHistory)
    .where(
      and(
        eq(studentRateHistory.studentId, input.studentId),
        eq(studentRateHistory.teacherId, teacherId),
      ),
    )
    .orderBy(asc(studentRateHistory.effectiveAt), asc(historySequence));
  const targetIndex = history.findIndex(({ id }) => id === input.rateId);

  if (targetIndex < 0) return { status: "notFound" } as const;
  if (targetIndex === 0 || targetIndex === history.length - 1) {
    return { status: "protected" } as const;
  }

  const deleteQuery = db
    .delete(studentRateHistory)
    .where(
      and(
        eq(studentRateHistory.id, input.rateId),
        eq(studentRateHistory.studentId, input.studentId),
        eq(studentRateHistory.teacherId, teacherId),
      ),
    )
    .returning({ id: studentRateHistory.id });

  const [deleted] = await deleteQuery;
  return deleted
    ? ({ status: "ok", data: deleted } as const)
    : ({ status: "notFound" } as const);
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
      .orderBy(desc(studentRateHistory.effectiveAt), desc(historySequence))
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
  const now = new Date();
  const feeBps = sql<number>`case when ${student.source} = 'preply' then ${preplyCommissionBps} else ${directCommissionBps} end`;
  const feeAmountMinor = sql<number>`cast((${student.hourlyRateMinor} * ${feeBps} + 5000) / 10000 as integer)`;
  const rankedHistory = db.$with("ranked_rate_history").as(
    db
      .select({
        studentId: studentRateHistory.studentId,
        grossRateMinor: studentRateHistory.grossRateMinor,
        feeBps: studentRateHistory.feeBps,
        source: studentRateHistory.source,
        rank: sql<number>`row_number() over (partition by ${studentRateHistory.studentId} order by ${studentRateHistory.effectiveAt} desc, ${historySequence} desc)`.as(
          "rank",
        ),
      })
      .from(studentRateHistory)
      .where(eq(studentRateHistory.teacherId, teacherId)),
  );
  const insertChangedRates = db
    .with(rankedHistory)
    .insert(studentRateHistory)
    .select(
      db
        .select({
          id: sql<string>`lower(hex(randomblob(16)))`.as("id"),
          studentId: student.id,
          teacherId: student.teacherId,
          grossRateMinor: student.hourlyRateMinor,
          feeBps: feeBps.as("fee_bps"),
          feeAmountMinor: feeAmountMinor.as("fee_amount_minor"),
          netRateMinor: sql<number>`${student.hourlyRateMinor} - ${feeAmountMinor}`.as(
            "net_rate_minor",
          ),
          source: student.source,
          effectiveAt: sql<Date>`${now.getTime()}`.as("effective_at"),
        })
        .from(student)
        .leftJoin(
          rankedHistory,
          and(
            eq(rankedHistory.studentId, student.id),
            eq(rankedHistory.rank, 1),
          ),
        )
        .where(
          and(
            eq(student.teacherId, teacherId),
            or(
              isNull(rankedHistory.studentId),
              ne(rankedHistory.grossRateMinor, student.hourlyRateMinor),
              ne(rankedHistory.source, student.source),
              ne(rankedHistory.feeBps, feeBps),
            ),
          ),
        ),
    );

  await db.batch([
    db
      .update(user)
      .set({ preplyCommissionBps, directCommissionBps })
      .where(eq(user.id, teacherId)),
    insertChangedRates,
  ]);

  return { preplyCommissionBps, directCommissionBps };
}
