import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { getStudentClassDetailAction } from "@/app/students/classes/query-actions";
import { getDateOnlyToday } from "@/lib/students/contracts";

import { loadStudentProfile } from "../../load-profile";
import { ClassForm } from "./class-form";

export async function ClassFormContent({
  studentId,
  classId,
  mode,
}: {
  studentId: string;
  classId?: string;
  mode: "add" | "edit";
}) {
  const [profile, t, result] = await Promise.all([
    loadStudentProfile(studentId),
    getTranslations("Classes"),
    classId ? getStudentClassDetailAction({ studentId, classId }) : null,
  ]);
  if (result && !result.ok) {
    if (result.error === "notFound") notFound();
    throw new Error(result.error);
  }
  const studentClass = result?.ok ? result.data : undefined;
  if (mode === "edit" && !studentClass) notFound();
  const initialDate = getDateOnlyToday(
    profile.teacherTimeZone,
    studentClass ? new Date(studentClass.scheduledAt) : new Date(),
  )!;
  return (
    <article className="flex h-[calc(92dvh-2rem)] flex-col p-6 sm:h-[calc(100dvh-2rem)] sm:p-8">
      <div className="shrink-0 pe-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {t(`${mode}.title`)}
        </h1>
        <p className="mt-2 text-muted-foreground">{profile.student.name}</p>
      </div>
      <ClassForm
        studentId={studentId}
        studentClass={studentClass}
        timeZone={profile.teacherTimeZone}
        studentSince={profile.student.studentSince}
        studentIsActive={profile.student.isActive}
        hourlyRateMinor={profile.student.hourlyRateMinor}
        currency={profile.currency}
        initialDate={initialDate}
      />
    </article>
  );
}
