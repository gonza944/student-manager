"use server";

import { getDb } from "@/db";
import {
  classAvailabilityInputSchema,
  studentClassIdInputSchema,
  studentClassPageInputSchema,
  studentClassTimelineInputSchema,
  type ClassAvailability,
  type StudentClassDto,
  type StudentClassPage,
  type StudentClassTimeline,
} from "@/lib/classes/contracts";
import {
  getTeacherClassAvailability,
  getTeacherStudentClassDetail,
  getTeacherStudentClassTimeline,
  listTeacherStudentClassesPage,
} from "@/lib/classes/queries";

import {
  getTeacherContext,
  validationError,
  type ClassActionResult,
} from "./action-context";

export async function getStudentClassDetailAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassDto>> {
  const parsed = studentClassIdInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await getTeacherStudentClassDetail(
    await getDb(),
    context.teacherId,
    parsed.data.studentId,
    parsed.data.classId,
  );
  return data ? { ok: true, data } : { ok: false, error: "notFound" };
}

export async function getClassAvailabilityAction(
  input: unknown,
): Promise<ClassActionResult<ClassAvailability>> {
  const parsed = classAvailabilityInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await getTeacherClassAvailability(
    await getDb(),
    context.teacherId,
    context.timeZone,
    parsed.data,
  );
  return { ok: true, data };
}

export async function getStudentClassTimelineAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassTimeline>> {
  const parsed = studentClassTimelineInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await getTeacherStudentClassTimeline(
    await getDb(),
    context.teacherId,
    parsed.data,
  );
  return data ? { ok: true, data } : { ok: false, error: "notFound" };
}

export async function listStudentClassesAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassPage>> {
  const parsed = studentClassPageInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await listTeacherStudentClassesPage(
    await getDb(),
    context.teacherId,
    parsed.data,
  );
  return data ? { ok: true, data } : { ok: false, error: "notFound" };
}
