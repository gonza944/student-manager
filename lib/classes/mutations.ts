import "server-only";

import { and, eq, getTableColumns } from "drizzle-orm";

import type { createDb } from "../../db";
import { studentClass } from "../../db/class-schema";
import { user } from "../../db/schema";
import { student } from "../../db/student-schema";
import {
  calculateClassChargeMinor,
  resolveEditedClassChargeMinor,
} from "./charge";
import {
  studentClassDtoSchema,
  type CreateStudentClassInput,
  type SetStudentClassStatusInput,
  type UpdateStudentClassInput,
} from "./contracts";
import { getTeacherStudentClassDetail } from "./queries";
import { resolveClassInterval } from "./scheduling";

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

export async function createTeacherStudentClass(
  db: Database,
  teacherId: string,
  input: CreateStudentClassInput,
) {
  const [owner] = await db
    .select({
      studentName: student.name,
      studentSince: student.studentSince,
      hourlyRateMinor: student.hourlyRateMinor,
      isActive: student.isActive,
      currency: user.currency,
      timeZone: user.timeZone,
    })
    .from(student)
    .innerJoin(user, eq(user.id, student.teacherId))
    .where(and(eq(student.id, input.studentId), eq(student.teacherId, teacherId)))
    .limit(1);
  if (!owner) return { status: "notFound" } as const;
  if (!owner.isActive) return { status: "inactive" } as const;

  const scheduledAt = new Date(input.scheduledAt);
  const interval = resolveClassInterval(
    scheduledAt,
    input.durationMinutes,
    owner.studentSince,
    owner.timeZone,
  );
  if (!interval.ok) return { status: interval.error } as const;

  const now = new Date();
  const [created] = await db
    .insert(studentClass)
    .values({
      id: crypto.randomUUID(),
      teacherId,
      studentId: input.studentId,
      scheduledAt,
      durationMinutes: input.durationMinutes,
      hourlyRateSnapshotMinor: owner.hourlyRateMinor,
      currency: owner.currency,
      chargeMinor: calculateClassChargeMinor(
        owner.hourlyRateMinor,
        input.durationMinutes,
      ),
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!created) {
    throw new Error("Class creation did not return the created record.");
  }

  return {
    status: "ok",
    data: toClassDto({ ...created, studentName: owner.studentName }),
  } as const;
}

export async function updateTeacherStudentClass(
  db: Database,
  teacherId: string,
  input: UpdateStudentClassInput,
) {
  const [existing] = await db
    .select({
      ...classSelection,
      studentSince: student.studentSince,
      timeZone: user.timeZone,
    })
    .from(studentClass)
    .innerJoin(student, eq(student.id, studentClass.studentId))
    .innerJoin(user, eq(user.id, studentClass.teacherId))
    .where(
      and(
        eq(studentClass.id, input.classId),
        eq(studentClass.studentId, input.studentId),
        eq(studentClass.teacherId, teacherId),
      ),
    )
    .limit(1);
  if (!existing) return { status: "notFound" } as const;

  const scheduledAt = new Date(input.scheduledAt);
  const interval = resolveClassInterval(
    scheduledAt,
    input.durationMinutes,
    existing.studentSince,
    existing.timeZone,
  );
  if (!interval.ok) return { status: interval.error } as const;

  const [updated] = await db
    .update(studentClass)
    .set({
      scheduledAt,
      durationMinutes: input.durationMinutes,
      chargeMinor: resolveEditedClassChargeMinor(
        existing.hourlyRateSnapshotMinor,
        existing.durationMinutes,
        input.durationMinutes,
        input.chargeMinor,
      ),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(studentClass.id, input.classId),
        eq(studentClass.studentId, input.studentId),
        eq(studentClass.teacherId, teacherId),
      ),
    )
    .returning();

  return updated
    ? ({
        status: "ok",
        data: toClassDto({ ...updated, studentName: existing.studentName }),
      } as const)
    : ({ status: "notFound" } as const);
}

export async function setTeacherStudentClassStatus(
  db: Database,
  teacherId: string,
  input: SetStudentClassStatusInput,
) {
  const existing = await getTeacherStudentClassDetail(
    db,
    teacherId,
    input.studentId,
    input.classId,
  );
  if (!existing) return null;
  if (existing.status === input.status) return existing;

  const [updated] = await db
    .update(studentClass)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(studentClass.id, input.classId),
        eq(studentClass.studentId, input.studentId),
        eq(studentClass.teacherId, teacherId),
      ),
    )
    .returning();

  return updated
    ? toClassDto({ ...updated, studentName: existing.studentName })
    : null;
}

export async function deleteTeacherStudentClass(
  db: Database,
  teacherId: string,
  studentId: string,
  classId: string,
) {
  const [deleted] = await db
    .delete(studentClass)
    .where(
      and(
        eq(studentClass.id, classId),
        eq(studentClass.studentId, studentId),
        eq(studentClass.teacherId, teacherId),
      ),
    )
    .returning({ id: studentClass.id, studentId: studentClass.studentId });

  return deleted ?? null;
}
