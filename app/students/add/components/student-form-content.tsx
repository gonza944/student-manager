import { notFound, redirect } from "next/navigation";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import {
  studentIdInputSchema,
  teacherRateSettingsSchema,
  type StudentDto,
} from "@/lib/students/contracts";
import { getTeacherStudentProfile } from "@/lib/students/data";

import { StudentForm } from "./student-form";

export async function StudentFormContent({
  studentId,
}: {
  studentId?: string;
}) {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);
  let student: StudentDto | undefined;

  if (studentId) {
    const parsed = studentIdInputSchema.safeParse({ studentId });
    if (!parsed.success) notFound();

    const profile = await getTeacherStudentProfile(
      await getDb(),
      auth.session.user.id,
      settings,
      parsed.data.studentId,
    );
    if (!profile) notFound();
    student = profile.student;
  }

  return (
    <StudentForm
      currency={settings.currency}
      preplyCommissionBps={settings.preplyCommissionBps}
      student={student}
    />
  );
}
