"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  createStudentClassInputSchema,
  setStudentClassStatusInputSchema,
  studentClassIdInputSchema,
  updateStudentClassInputSchema,
  type StudentClassDto,
} from "@/lib/classes/contracts";
import {
  createTeacherStudentClass,
  deleteTeacherStudentClass,
  setTeacherStudentClassStatus,
  updateTeacherStudentClass,
} from "@/lib/classes/mutations";

import {
  getTeacherContext,
  validationError,
  type ClassActionResult,
} from "./action-context";

function isScheduleConflict(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("student_class interval overlaps an existing class")
  );
}

function revalidateClassPaths(studentId: string, classId: string) {
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${studentId}/classes/${classId}`);
}

export async function createStudentClassAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassDto>> {
  const parsed = createStudentClassInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  try {
    const result = await createTeacherStudentClass(
      await getDb(),
      context.teacherId,
      parsed.data,
    );
    if (result.status === "notFound") return { ok: false, error: "notFound" };
    if (result.status === "inactive") {
      return { ok: false, error: "inactiveStudent" };
    }
    if (result.status === "invalidDate") {
      return { ok: false, error: "invalidClassDate" };
    }
    if (result.status === "invalidInterval") {
      return { ok: false, error: "invalidClassInterval" };
    }
    if (!result.data) throw new Error("Class creation returned no class.");

    revalidateClassPaths(result.data.studentId, result.data.id);
    return { ok: true, data: result.data };
  } catch (error) {
    if (isScheduleConflict(error)) {
      return { ok: false, error: "scheduleConflict" };
    }
    throw error;
  }
}

export async function updateStudentClassAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassDto>> {
  const parsed = updateStudentClassInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  try {
    const result = await updateTeacherStudentClass(
      await getDb(),
      context.teacherId,
      parsed.data,
    );
    if (result.status === "notFound") return { ok: false, error: "notFound" };
    if (result.status === "invalidDate") {
      return { ok: false, error: "invalidClassDate" };
    }
    if (result.status === "invalidInterval") {
      return { ok: false, error: "invalidClassInterval" };
    }
    if (!result.data) throw new Error("Class update returned no class.");

    revalidateClassPaths(result.data.studentId, result.data.id);
    return { ok: true, data: result.data };
  } catch (error) {
    if (isScheduleConflict(error)) {
      return { ok: false, error: "scheduleConflict" };
    }
    throw error;
  }
}

export async function setStudentClassStatusAction(
  input: unknown,
): Promise<ClassActionResult<StudentClassDto>> {
  const parsed = setStudentClassStatusInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  try {
    const data = await setTeacherStudentClassStatus(
      await getDb(),
      context.teacherId,
      parsed.data,
    );
    if (!data) return { ok: false, error: "notFound" };

    revalidateClassPaths(data.studentId, data.id);
    return { ok: true, data };
  } catch (error) {
    if (isScheduleConflict(error)) {
      return { ok: false, error: "scheduleConflict" };
    }
    throw error;
  }
}

export async function deleteStudentClassAction(
  input: unknown,
): Promise<ClassActionResult<{ id: string }>> {
  const parsed = studentClassIdInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await deleteTeacherStudentClass(
    await getDb(),
    context.teacherId,
    parsed.data.studentId,
    parsed.data.classId,
  );
  if (!data) return { ok: false, error: "notFound" };

  revalidateClassPaths(data.studentId, data.id);
  return { ok: true, data: { id: data.id } };
}
