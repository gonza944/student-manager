import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import { teacherRateSettingsSchema } from "@/lib/students/contracts";
import { listTeacherStudents } from "@/lib/students/data";
import { StudentDirectory } from "./components/student-directory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Students");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function StudentsPage() {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);
  const initialData = await listTeacherStudents(
    await getDb(),
    auth.session.user.id,
    settings,
  );

  return <StudentDirectory initialData={initialData} />;
}
