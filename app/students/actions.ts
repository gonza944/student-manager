"use server";

// Public server entrypoints used by the UI: authenticate, validate untrusted
// input, call the database layer, and return a small serializable result.
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "../../db";
import { requireRole } from "../../lib/auth/server";
import {
  createStudentInputSchema,
  deleteStudentRateInputSchema,
  setStudentActiveInputSchema,
  studentIdInputSchema,
  studentListInputSchema,
  studentRateHistoryListInputSchema,
  teacherRateSettingsSchema,
  updateStudentInputSchema,
  updateStudentRateInputSchema,
  type StudentDto,
  type StudentListPage,
  type StudentRateHistoryPage,
} from "../../lib/students/contracts";
import {
  createTeacherStudent,
  deleteTeacherStudentRate,
  deleteTeacherStudent,
  listTeacherStudentsPage,
  listTeacherStudentRatesPage,
  setTeacherStudentActive,
  updateTeacherStudent,
  updateTeacherStudentRate,
} from "../../lib/students/data";

type ActionError =
  | {
      ok: false;
      error:
        | "unauthenticated"
        | "forbidden"
        | "notFound"
        | "conflict"
        | "invalidRateDate"
        | "rateOverlap"
        | "protectedRate";
    }
  | { ok: false; error: "validation"; fields: string[] };
type ActionResult<T> = { ok: true; data: T } | ActionError;

async function getTeacherContext(): Promise<
  | {
      ok: true;
      teacherId: string;
      settings: z.output<typeof teacherRateSettingsSchema>;
    }
  | ActionError
> {
  const auth = await requireRole("teacher");
  if ("error" in auth) return { ok: false, error: auth.error };

  const settings = teacherRateSettingsSchema.safeParse(auth.session.user);
  if (!settings.success) {
    throw new Error("The authenticated teacher has invalid rate settings.");
  }

  return {
    ok: true,
    teacherId: auth.session.user.id,
    settings: settings.data,
  };
}

function validationError(error: z.ZodError): ActionError {
  return {
    ok: false,
    error: "validation",
    fields: [...new Set(error.issues.map((issue) => String(issue.path[0] ?? "form")))],
  };
}

export async function listStudentsAction(
  input: unknown = {},
): Promise<ActionResult<StudentListPage>> {
  const parsed = studentListInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await listTeacherStudentsPage(
    await getDb(),
    context.teacherId,
    context.settings,
    parsed.data,
  );
  return { ok: true, data };
}

export async function listStudentRatesAction(
  input: unknown,
): Promise<ActionResult<StudentRateHistoryPage>> {
  const parsed = studentRateHistoryListInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await listTeacherStudentRatesPage(
    await getDb(),
    context.teacherId,
    parsed.data,
  );
  return { ok: true, data };
}

export async function createStudentAction(
  input: unknown,
): Promise<ActionResult<StudentDto>> {
  const parsed = createStudentInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  try {
    const data = await createTeacherStudent(
      await getDb(),
      context.teacherId,
      parsed.data,
      context.settings.preplyCommissionBps,
      context.settings.directCommissionBps,
    );
    revalidatePath("/students");
    revalidatePath("/");
    return { ok: true, data };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("student_teacher_email_unique") ||
        error.message.includes("UNIQUE constraint failed: student.teacher_id, student.email"))
    ) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}

export async function updateStudentAction(
  input: unknown,
): Promise<ActionResult<StudentDto>> {
  const parsed = updateStudentInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  try {
    const data = await updateTeacherStudent(
      await getDb(),
      context.teacherId,
      parsed.data,
      context.settings.preplyCommissionBps,
      context.settings.directCommissionBps,
    );
    if (!data) return { ok: false, error: "notFound" };

    revalidatePath("/students");
    revalidatePath(`/students/${parsed.data.studentId}`);
    revalidatePath("/");
    return { ok: true, data };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("student_teacher_email_unique") ||
        error.message.includes("UNIQUE constraint failed: student.teacher_id, student.email"))
    ) {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}

export async function updateStudentRateAction(
  input: unknown,
): Promise<ActionResult<StudentDto>> {
  const parsed = updateStudentRateInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const result = await updateTeacherStudentRate(
    await getDb(),
    context.teacherId,
    parsed.data,
    context.settings.preplyCommissionBps,
    context.settings.directCommissionBps,
  );
  if (result.status === "notFound") return { ok: false, error: "notFound" };
  if (result.status === "invalidDate") {
    return { ok: false, error: "invalidRateDate" };
  }
  if (result.status === "overlap") {
    return { ok: false, error: "rateOverlap" };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/");
  return { ok: true, data: result.data };
}

export async function deleteStudentRateAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteStudentRateInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const result = await deleteTeacherStudentRate(
    await getDb(),
    context.teacherId,
    parsed.data,
  );
  if (result.status === "notFound") return { ok: false, error: "notFound" };
  if (result.status === "protected") {
    return { ok: false, error: "protectedRate" };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/");
  return { ok: true, data: result.data };
}

export async function setStudentActiveAction(
  input: unknown,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  const parsed = setStudentActiveInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await setTeacherStudentActive(
    await getDb(),
    context.teacherId,
    parsed.data.studentId,
    parsed.data.isActive,
  );
  if (!data) return { ok: false, error: "notFound" };

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/");
  return { ok: true, data };
}

export async function deleteStudentAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = studentIdInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const context = await getTeacherContext();
  if (!context.ok) return context;

  const data = await deleteTeacherStudent(
    await getDb(),
    context.teacherId,
    parsed.data.studentId,
  );
  if (!data) return { ok: false, error: "notFound" };

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath("/");
  return { ok: true, data };
}
