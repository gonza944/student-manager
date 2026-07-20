import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { requireRole } from "@/lib/auth/server";
import { teacherRateSettingsSchema } from "@/lib/students/contracts";
import { listTeacherStudents } from "@/lib/students/data";
import { StudentsDirectory } from "./students-directory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Students");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function StudentsPage() {
  const auth = await requireRole("teacher");
  if ("error" in auth) redirect("/login");

  const settings = teacherRateSettingsSchema.parse(auth.session.user);
  const [initialData, messages] = await Promise.all([
    listTeacherStudents(await getDb(), auth.session.user.id, settings),
    getMessages(),
  ]);

  return (
    <NextIntlClientProvider messages={{ Students: messages.Students }}>
      <StudentsDirectory initialData={initialData} />
    </NextIntlClientProvider>
  );
}
