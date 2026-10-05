import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { getDevelopmentStudentClasses } from "@/lib/classes/development-fixtures";
import { getDateOnlyToday } from "@/lib/students/contracts";

import { loadStudentProfile } from "../../load-profile";
import { ClassFormPreview } from "./class-form-preview";

export async function ClassPreviewContent({
  studentId,
  classId,
  mode,
}: {
  studentId: string;
  classId?: string;
  mode: "add" | "edit";
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const [profile, locale, t] = await Promise.all([
    loadStudentProfile(studentId),
    getLocale(),
    getTranslations("Classes"),
  ]);
  const classes = getDevelopmentStudentClasses(
    profile.student.id,
    profile.student.name,
    profile.currency,
  );
  const studentClass = classId
    ? classes.find((item) => item.id === classId)
    : classes.at(-1);
  if (!studentClass || (mode === "add" && !profile.student.isActive)) notFound();

  const scheduledAt = new Date(studentClass.scheduledAt);
  const initialDate =
    getDateOnlyToday(profile.teacherTimeZone, scheduledAt) ??
    studentClass.scheduledAt.slice(0, 10);
  const timeParts = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: profile.teacherTimeZone,
  }).formatToParts(scheduledAt);
  const initialTime = `${timeParts.find((part) => part.type === "hour")?.value ?? "00"}:${timeParts.find((part) => part.type === "minute")?.value ?? "00"}`;

  return (
    <article className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 pe-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {t(`${mode}.title`)}
          </h1>
          <p className="mt-2 text-muted-foreground">{profile.student.name}</p>
        </div>
      </div>

      <ClassFormPreview
        mode={mode}
        locale={locale}
        timeZone={profile.teacherTimeZone}
        minDate={profile.student.studentSince}
        initialDate={initialDate}
        initialTime={initialTime}
        labels={{
          date: t("fields.date"),
          datePlaceholder: t("fields.datePlaceholder"),
          openDate: t("fields.openDate"),
          startTime: t("fields.startTime"),
          openTime: t("fields.openTime"),
          save: t("actions.save"),
        }}
      />
    </article>
  );
}
